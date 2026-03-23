import { getProviderKeys, getProviderName } from "@/app/lib/groq";
import { fetchMarketData, fetchWeatherData } from "@/app/lib/realTimeData";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { runDailySummaryCron } from "../cron/daily-summary/route";
import { verifyAdminToken } from "./auth/route";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const unauth = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

/* ── GET: tüm stats ── */
export async function GET(request) {
  if (!verifyAdminToken(request)) return unauth();

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const [
    cronLogs,
    lastSuccess,
    cacheToday,
    cacheYest,
    apiToday,
    apiTotal,
    hitsToday,
    missesToday,
    dbSize,
    errGemini,
    errGroq,
    errNews,
    summarizeHits,
    analyzHits,
    compareHits,
    summarizeMiss,
    analyzMiss,
    compareMiss,
    subscriberCount,
    subscriberTotal,
    subscriberToday,
    streamHits,
    streamMiss,
    relatedCalls,
  ] = await Promise.all([
    redis.lrange("cron:log", 0, 29).catch(() => []),
    redis.get("cron:lastSuccess").catch(() => null),
    redis.get(`daily-summary-v6:${today}`).catch(() => null),
    redis.get(`daily-summary-v6:${yesterday}`).catch(() => null),
    redis.get("stats:api:calls:today").catch(() => 0),
    redis.get("stats:api:calls:total").catch(() => 0),
    redis.get("stats:cache:hits:today").catch(() => 0),
    redis.get("stats:cache:misses:today").catch(() => 0),
    redis.dbsize().catch(() => 0),
    redis.get("stats:errors:gemini").catch(() => 0),
    redis.get("stats:errors:groq").catch(() => 0),
    redis.get("stats:errors:news").catch(() => 0),
    redis.get("stats:hits:summarize").catch(() => 0),
    redis.get("stats:hits:analyze").catch(() => 0),
    redis.get("stats:hits:compare").catch(() => 0),
    redis.get("stats:miss:summarize").catch(() => 0),
    redis.get("stats:miss:analyze").catch(() => 0),
    redis.get("stats:miss:compare").catch(() => 0),
    // Aboneler
    redis.scard("digest:subscribers").catch(() => 0),
    redis.get("stats:subscribers:total").catch(() => 0),
    redis.get(`stats:subscribers:today:${today}`).catch(() => 0),
    // Stream summary istatistikleri
    redis.get("stats:hits:stream-summary").catch(() => 0),
    redis.get("stats:miss:stream-summary").catch(() => 0),
    // Related news çağrı sayısı
    redis.get("stats:api:related-news:calls").catch(() => 0),
  ]);

  // Per-provider AI stats
  const providerKeys = getProviderKeys();
  const providerStatsRaw = await Promise.all(
    providerKeys.flatMap((k) => [
      redis.get(`stats:ai:${k}:calls`).catch(() => 0),
      redis.get(`stats:ai:${k}:calls:today`).catch(() => 0),
      redis.get(`stats:ai:${k}:errors`).catch(() => 0),
      redis.get(`stats:ai:${k}:rateLimits`).catch(() => 0),
    ]),
  );
  const aiProviders = {};
  providerKeys.forEach((k, i) => {
    const offset = i * 4;
    aiProviders[k] = {
      name: getProviderName(k),
      calls: Number(providerStatsRaw[offset]) || 0,
      callsToday: Number(providerStatsRaw[offset + 1]) || 0,
      errors: Number(providerStatsRaw[offset + 2]) || 0,
      rateLimits: Number(providerStatsRaw[offset + 3]) || 0,
    };
  });

  const logs = cronLogs
    .map((l) => {
      try {
        return typeof l === "string" ? JSON.parse(l) : l;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const hits = Number(hitsToday) || 0;
  const misses = Number(missesToday) || 0;
  const total = hits + misses;

  const successLogs = logs.filter((l) => l.status === "success");
  const durations = successLogs
    .filter((l) => l.durationMs)
    .map((l) => l.durationMs);

  // NewsData API key havuzu durumu
  const rawKeys = (
    process.env.NEWSDATA_API_KEYS ||
    process.env.NEWSDATA_API_KEY ||
    ""
  )
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const keyStatuses = await Promise.all(
    rawKeys.map(async (k) => ({
      suffix: `…${k.slice(-6)}`,
      exhausted: !!(await redis
        .get(`newsdata:exhausted:${k.slice(-6)}`)
        .catch(() => null)),
    })),
  );

  return NextResponse.json({
    now: new Date().toISOString(),
    today,
    yesterday,
    lastSuccess,
    cronSchedule: "Her gün 04:00 UTC (07:00 İstanbul)",
    logs,
    cache: {
      today: !!cacheToday,
      yesterday: !!cacheYest,
      todayMeta: cacheToday
        ? {
            headline: cacheToday.headline,
            issueNumber: cacheToday.issueNumber,
            generatedAt: cacheToday.generatedAt,
            articleCount: cacheToday.articleCount,
            dayMood: cacheToday.dayMood,
          }
        : null,
      yesterdayMeta: cacheYest
        ? {
            headline: cacheYest.headline,
            issueNumber: cacheYest.issueNumber,
          }
        : null,
    },
    stats: {
      api: {
        callsToday: Number(apiToday) || 0,
        callsTotal: Number(apiTotal) || 0,
      },
      cache: {
        hitsToday: hits,
        missesToday: misses,
        hitRate: total > 0 ? Math.round((hits / total) * 100) : null,
        byEndpoint: {
          summarize: {
            hits: Number(summarizeHits) || 0,
            misses: Number(summarizeMiss) || 0,
          },
          analyze: {
            hits: Number(analyzHits) || 0,
            misses: Number(analyzMiss) || 0,
          },
          compare: {
            hits: Number(compareHits) || 0,
            misses: Number(compareMiss) || 0,
          },
          "stream-summary": {
            hits: Number(streamHits) || 0,
            misses: Number(streamMiss) || 0,
          },
        },
      },
      errors: {
        gemini: Number(errGemini) || 0,
        groq: Number(errGroq) || 0,
        news: Number(errNews) || 0,
        total:
          (Number(errGemini) || 0) +
          (Number(errGroq) || 0) +
          (Number(errNews) || 0),
      },
      newsApiKeys: keyStatuses,
      cron: {
        totalRuns: logs.length,
        successRuns: successLogs.length,
        errorRuns: logs.filter((l) => l.status === "error").length,
        skippedRuns: logs.filter((l) => l.status === "skipped").length,
        successRate:
          logs.length > 0
            ? Math.round((successLogs.length / logs.length) * 100)
            : null,
        avgDurationMs:
          durations.length > 0
            ? Math.round(
                durations.reduce((a, b) => a + b, 0) / durations.length,
              )
            : null,
        minDurationMs: durations.length > 0 ? Math.min(...durations) : null,
        maxDurationMs: durations.length > 0 ? Math.max(...durations) : null,
      },
      redis: { dbSize: Number(dbSize) || 0 },
      aiProviders,
      subscribers: {
        total: Number(subscriberCount) || 0, // Redis SCARD (gerçek sayı)
        signupsAllTime: Number(subscriberTotal) || 0, // stats sayacı
        signupsToday: Number(subscriberToday) || 0,
      },
      newFeatures: {
        relatedNewsCalls: Number(relatedCalls) || 0,
      },
    },
  });
}

/* ── POST: actions ── */
export async function POST(request) {
  if (!verifyAdminToken(request)) return unauth();

  const { action, email: bodyEmail } = await request.json().catch(() => ({}));

  if (action === "list-subscribers") {
    const emails = await redis.smembers("digest:subscribers").catch(() => []);
    return NextResponse.json({ emails: emails.sort() });
  }

  if (action === "remove-subscriber") {
    if (!bodyEmail)
      return NextResponse.json({ error: "email gerekli" }, { status: 400 });
    await redis
      .srem("digest:subscribers", bodyEmail.toLowerCase().trim())
      .catch(() => {});
    return NextResponse.json({ removed: true });
  }

  if (action === "trigger-cron") {
    const result = await runDailySummaryCron("admin-manual");
    return NextResponse.json(
      { triggered: true, result },
      { status: result.success || result.skipped ? 200 : 500 },
    );
  }

  if (action === "trigger-column") {
    const { generateColumn } = await import("@/app/lib/generateColumn");
    const result = await generateColumn();
    return NextResponse.json(
      { triggered: true, result },
      { status: result.success || result.skipped ? 200 : 500 },
    );
  }

  if (action === "refresh-markets") {
    await redis.del("realtime:markets").catch(() => {});
    const result = await fetchMarketData().catch((e) => ({ error: e.message }));
    return NextResponse.json({ refreshed: true, result });
  }

  if (action === "refresh-weather") {
    // Istanbul’u seed'le; diğer şehirler ilk istek gelince öyle dolar
    const { CITIES } = await import("@/app/lib/cityConfig");
    const deleted = await Promise.all(
      CITIES.map((c) => redis.del(`realtime:weather:${c.key}`).catch(() => {})),
    );
    const istanbul = await fetchWeatherData("Istanbul").catch((e) => ({
      error: e.message,
    }));
    return NextResponse.json({
      refreshed: true,
      deleted: deleted.length,
      istanbul,
    });
  }

  if (action === "clear-cache") {
    const t = new Date().toISOString().slice(0, 10);
    await Promise.all(
      ["v6", "v5", "v4", "v3"].map((v) =>
        redis.del(`daily-summary-${v}:${t}`).catch(() => {}),
      ),
    );
    return NextResponse.json({ cleared: true });
  }

  if (action === "clear-analysis-cache") {
    let cursor = 0;
    let deleted = 0;
    do {
      const [nextCursor, keys] = await redis
        .scan(cursor, { match: "analyze:*", count: 100 })
        .catch(() => ["0", []]);
      cursor = Number(nextCursor);
      if (keys.length > 0) {
        await redis.del(...keys).catch(() => {});
        deleted += keys.length;
      }
    } while (cursor !== 0);
    return NextResponse.json({ cleared: true, deleted });
  }

  if (action === "clear-logs") {
    await Promise.all(
      [redis.del("cron:log"), redis.del("cron:lastSuccess")].map((p) =>
        p.catch(() => {}),
      ),
    );
    return NextResponse.json({ cleared: true });
  }

  if (action === "reset-stats") {
    const providerKeys = getProviderKeys();
    const keys = [
      "stats:api:calls:today",
      "stats:cache:hits:today",
      "stats:cache:misses:today",
      "stats:errors:gemini",
      "stats:errors:groq",
      "stats:errors:news",
      "stats:hits:summarize",
      "stats:hits:analyze",
      "stats:hits:compare",
      "stats:miss:summarize",
      "stats:miss:analyze",
      "stats:miss:compare",
      "stats:hits:stream-summary",
      "stats:miss:stream-summary",
      "stats:api:related-news:calls",
      `stats:subscribers:today:${new Date().toISOString().slice(0, 10)}`,
      ...providerKeys.flatMap((k) => [
        `stats:ai:${k}:calls`,
        `stats:ai:${k}:calls:today`,
        `stats:ai:${k}:errors`,
        `stats:ai:${k}:rateLimits`,
      ]),
    ];
    await Promise.all(keys.map((k) => redis.del(k).catch(() => {})));
    return NextResponse.json({ reset: true });
  }

  return NextResponse.json({ error: "Bilinmeyen action" }, { status: 400 });
}
