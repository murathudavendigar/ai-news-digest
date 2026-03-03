import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import webpush from "web-push";
import { verifyAdminToken } from "../auth/route";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

webpush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export async function POST(request) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  let payload;

  if (body.articleId) {
    // articleId verilmişse Redis'ten makaleyi çek
    const article = await redis.get(`article:${body.articleId}`);
    if (!article) {
      return NextResponse.json({ error: "Makale bulunamadı" }, { status: 404 });
    }
    const a = typeof article === "string" ? JSON.parse(article) : article;
    payload = {
      title: body.title || `📰 ${a.source_name}`,
      body: a.title.slice(0, 120),
      url: a.link || "/",
      icon: a.source_icon || "/icon-192.png",
      badge: "/icon-192.png",
      tag: `manual-${body.articleId}`,
      data: { articleId: a.article_id, url: a.link || "/" },
    };
  } else {
    // Manuel başlık/içerik
    if (!body.title || !body.body) {
      return NextResponse.json(
        { error: "title ve body gerekli" },
        { status: 400 },
      );
    }
    payload = {
      title: body.title.slice(0, 60),
      body: body.body.slice(0, 120),
      url: body.url || "/",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: `manual-${Date.now()}`,
      data: { url: body.url || "/" },
    };
  }

  // Gönder
  const endpointKeys = await redis.smembers("push:endpoints").catch(() => []);
  if (!endpointKeys.length) {
    return NextResponse.json({ sent: 0, reason: "no-subscribers" });
  }

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
        if (err.statusCode === 404 || err.statusCode === 410) expired.push(key);
        else failed++;
      }
    }),
  );

  if (expired.length) {
    await Promise.all([
      ...expired.map((k) => redis.del(k)),
      redis.srem("push:endpoints", ...expired),
    ]);
  }

  // Log
  await redis.lpush(
    "push:manual:log",
    JSON.stringify({
      sentAt: new Date().toISOString(),
      title: payload.title,
      body: payload.body,
      sent,
      failed,
      expired: expired.length,
    }),
  );
  await redis.ltrim("push:manual:log", 0, 19);

  return NextResponse.json({ sent, failed, expired: expired.length, payload });
}

// Son breaking news loglarını döndür
export async function GET(request) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [breakingLog, manualLog, todayCount, subscriberCount] =
    await Promise.all([
      redis.lrange("push:breaking:log", 0, 19).catch(() => []),
      redis.lrange("push:manual:log", 0, 9).catch(() => []),
      redis
        .get(`push:breaking:count:${new Date().toISOString().slice(0, 10)}`)
        .catch(() => "0"),
      redis.scard("push:endpoints").catch(() => 0),
    ]);

  return NextResponse.json({
    subscribers: subscriberCount,
    todayBreakingCount: parseInt(todayCount || "0"),
    breakingLog: breakingLog.map((l) =>
      typeof l === "string" ? JSON.parse(l) : l,
    ),
    manualLog: manualLog.map((l) =>
      typeof l === "string" ? JSON.parse(l) : l,
    ),
  });
}
