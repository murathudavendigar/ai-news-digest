// api/cron/midnight-reset/route.js
// Her gün 00:00 UTC — NewsData exhausted key'leri ve günlük kotaları sıfırla

import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { cleared: [], failed: [] };

  // ── 1. NewsData exhausted key'leri temizle ────────────────────────────────
  // TTL zaten gece yarısına ayarlı ama garantiye almak için el ile de sil
  try {
    // SCAN ile newsdata:exhausted:* pattern'ını bul
    let cursor = 0;
    const exhaustedKeys = [];
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: "newsdata:exhausted:*",
        count: 100,
      });
      cursor = Number(nextCursor);
      exhaustedKeys.push(...keys);
    } while (cursor !== 0);

    if (exhaustedKeys.length) {
      await Promise.all(exhaustedKeys.map((k) => redis.del(k)));
      results.cleared.push(`${exhaustedKeys.length} newsdata:exhausted:* key`);
    }
  } catch (e) {
    results.failed.push(`exhausted keys: ${e.message}`);
  }

  // ── 2. Günlük stats sıfırla ───────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  try {
    const dailyKeys = [
      "stats:api:calls:today",
      "stats:cache:hits:today",
      "stats:cache:misses:today",
      "stats:hits:summarize",
      "stats:miss:summarize",
      "stats:hits:analyze",
      "stats:miss:analyze",
      "stats:hits:compare",
      "stats:miss:compare",
      "stats:hits:stream-summary",
      "stats:miss:stream-summary",
      ...["groq", "sambanova", "cerebras", "openrouter"].map(
        (k) => `stats:ai:${k}:calls:today`,
      ),
      `stats:subscribers:today:${today}`,
    ];
    await Promise.all(dailyKeys.map((k) => redis.del(k).catch(() => {})));
    results.cleared.push(`${dailyKeys.length} stats:*:today key`);
  } catch (e) {
    results.failed.push(`daily stats: ${e.message}`);
  }

  console.log("[midnight-reset] Tamamlandı:", results);
  return NextResponse.json({
    ok: true,
    resetAt: new Date().toISOString(),
    ...results,
  });
}
