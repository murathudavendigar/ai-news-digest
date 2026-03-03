// api/cron/push-notify/route.js
// Vercel Cron: her gün 17:00 UTC = 20:00 İstanbul

export const maxDuration = 30;

import { getDailySummary } from "@/app/lib/dailySummary";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import webpush from "web-push";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

webpush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export async function GET(request) {
  // Auth
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Günlük özetin cache'de olup olmadığını kontrol et
  const summary = await getDailySummary();
  if (!summary) {
    return NextResponse.json({ skipped: true, reason: "no-summary" });
  }

  // Bildirim içeriğini hazırla
  // mustRead varsa ilk 3'ü al, yoksa sections'tan al
  const headlines = (summary.mustRead ?? [])
    .slice(0, 3)
    .map((h, i) => `${i + 1}. ${h.title}`)
    .join("\n");

  const payload = JSON.stringify({
    title: `📰 HaberAI — Günün Özeti #${summary.issueNumber ?? ""}`,
    body: headlines || summary.headline || "Bugünün haberleri hazır!",
    url: "/summary",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });

  // Tüm abonelik anahtarlarını çek
  const endpointKeys = await redis.smembers("push:endpoints").catch(() => []);
  if (!endpointKeys.length) {
    return NextResponse.json({ sent: 0, reason: "no-subscribers" });
  }

  let sent = 0;
  let failed = 0;
  const expired = [];

  await Promise.allSettled(
    endpointKeys.map(async (key) => {
      try {
        const raw = await redis.get(key);
        if (!raw) return;
        const sub = typeof raw === "string" ? JSON.parse(raw) : raw;
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (err) {
        // 404/410 = abonelik süresi dolmuş → temizle
        if (err.statusCode === 404 || err.statusCode === 410) {
          expired.push(key);
        } else {
          failed++;
          console.error("[push-notify] Gönderim hatası:", err.message);
        }
      }
    }),
  );

  // Süresi dolmuş abonelikleri temizle
  if (expired.length) {
    await Promise.all([
      ...expired.map((k) => redis.del(k)),
      redis.srem("push:endpoints", ...expired),
    ]);
  }

  console.log(
    `[push-notify] Gönderildi: ${sent}, Başarısız: ${failed}, Temizlendi: ${expired.length}`,
  );
  return NextResponse.json({ sent, failed, expired: expired.length });
}
