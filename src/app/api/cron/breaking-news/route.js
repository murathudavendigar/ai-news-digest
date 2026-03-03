import { fetchMultipleRSS } from "@/app/lib/rssParser";
import { getAllSources } from "@/app/lib/rssSources";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import webpush from "web-push";

export const maxDuration = 30;

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

webpush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

// ── Son dakika anahtar kelimeleri ─────────────────────────────────────────
const BREAKING_KEYWORDS = [
  // Acil / felaket
  "son dakika",
  "acil",
  "deprem",
  "tsunami",
  "sel",
  "yangın",
  "patlama",
  "saldırı",
  "kaza",
  "ölü",
  "yaralı",
  "hayatını kaybetti",
  // Siyasi
  "istifa",
  "görevden alındı",
  "atandı",
  "flaş",
  "olağanüstü hal",
  // Ekonomi
  "faiz kararı",
  "merkez bankası kararı",
  "borsa çöktü",
  "iflas",
  // Spor
  "şampiyon oldu",
  "finale çıktı",
  "elendi",
  "rekor kırdı",
];

// ── İstanbul saati kontrolü ───────────────────────────────────────────────
function isActiveHours() {
  const now = new Date();
  const hour = parseInt(
    now.toLocaleString("tr-TR", {
      timeZone: "Europe/Istanbul",
      hour: "numeric",
      hour12: false,
    }),
  );
  return hour >= 8 && hour < 23;
}

// ── Son dakika testi ──────────────────────────────────────────────────────
function isBreaking(article) {
  const text = `${article.title} ${article.description || ""}`.toLowerCase();
  return BREAKING_KEYWORDS.some((kw) => text.includes(kw));
}

// ── Tüm abonelere gönder ──────────────────────────────────────────────────
async function sendPushToAll(payload) {
  const endpointKeys = await redis.smembers("push:endpoints").catch(() => []);
  if (!endpointKeys.length) return { sent: 0, failed: 0, expired: 0 };

  let sent = 0,
    failed = 0;
  const expired = [];

  await Promise.allSettled(
    endpointKeys.map(async (key) => {
      try {
        const raw = await redis.get(key);
        if (!raw) return;
        const sub = typeof raw === "string" ? JSON.parse(raw) : raw;
        await webpush.sendNotification(sub, JSON.stringify(payload));
        sent++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          expired.push(key);
        } else {
          failed++;
        }
      }
    }),
  );

  if (expired.length) {
    await Promise.all([
      ...expired.map((k) => redis.del(k)),
      redis.srem("push:endpoints", ...expired),
    ]);
  }

  return { sent, failed, expired: expired.length };
}

// ── Ana cron handler ──────────────────────────────────────────────────────
export async function GET(request) {
  // Auth
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Saat kontrolü — gece sessiz saatlerde çalışma
  if (!isActiveHours()) {
    return NextResponse.json({ skipped: true, reason: "outside-active-hours" });
  }

  // Günlük bildirim limiti (max 3 breaking)
  const today = new Date().toISOString().slice(0, 10);
  const countKey = `push:breaking:count:${today}`;
  const todayCount = parseInt(
    (await redis.get(countKey).catch(() => "0")) || "0",
  );
  if (todayCount >= 1) {
    return NextResponse.json({
      skipped: true,
      reason: "daily-limit-reached",
      count: todayCount,
    });
  }

  // Sadece priority 1 kaynaklardan çek
  const sources = getAllSources()
    .filter((s) => s.priority === 1)
    .slice(0, 10);
  const articles = await fetchMultipleRSS(sources, { maxConcurrent: 5 });

  // Son 25 saat içindeki haberleri filtrele (günlük cron + 1 saat buffer)
  const cutoff = Date.now() - 25 * 60 * 60 * 1000;
  const recentArticles = articles.filter(
    (a) => new Date(a.pubDate).getTime() > cutoff,
  );

  // Son dakika kriterini karşılayanları bul
  const breakingArticles = recentArticles.filter(isBreaking);

  if (!breakingArticles.length) {
    return NextResponse.json({
      skipped: true,
      reason: "no-breaking-news",
      checked: recentArticles.length,
      total: articles.length,
    });
  }

  // En yeni haberi seç
  const article = breakingArticles.sort(
    (a, b) => new Date(b.pubDate) - new Date(a.pubDate),
  )[0];

  // Daha önce gönderildi mi? (6 saat TTL)
  const sentKey = `push:breaking:sent:${article.article_id}`;
  const alreadySent = await redis.exists(sentKey).catch(() => 0);
  if (alreadySent) {
    return NextResponse.json({
      skipped: true,
      reason: "already-sent",
      title: article.title,
    });
  }

  // Bildirimi gönder
  const payload = {
    title: `🔴 Son Dakika — ${article.source_name}`,
    body: article.title.slice(0, 120),
    url: article.link || "/",
    icon: article.source_icon || "/icon-192.png",
    badge: "/icon-192.png",
    tag: "breaking-news", // aynı tag → önceki bildirimi override eder
    renotify: true,
    data: {
      articleId: article.article_id,
      sourceId: article.source_id,
      url: article.link || "/",
    },
  };

  const result = await sendPushToAll(payload);

  // İşaretle + sayacı artır
  await Promise.all([
    redis.set(sentKey, "1", { ex: 6 * 3600 }),
    redis.set(countKey, String(todayCount + 1), { ex: 25 * 3600 }),
    redis.lpush(
      "push:breaking:log",
      JSON.stringify({
        sentAt: new Date().toISOString(),
        title: article.title,
        source: article.source_name,
        articleId: article.article_id,
        todayTotal: todayCount + 1,
        ...result,
      }),
    ),
  ]);
  await redis.ltrim("push:breaking:log", 0, 49);

  return NextResponse.json({
    sent: result.sent,
    article: {
      title: article.title,
      source: article.source_name,
      pubDate: article.pubDate,
    },
    todayTotal: todayCount + 1,
  });
}
