import { getProviderKeys, getProviderName } from "@/app/lib/groq";
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
  ] = await Promise.all([
    redis.lrange("cron:log", 0, 29).catch(() => []),
    redis.get("cron:lastSuccess").catch(() => null),
    redis.get(`daily-summary-v5:${today}`).catch(() => null),
    redis.get(`daily-summary-v5:${yesterday}`).catch(() => null),
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
    },
  });
}

/* ── POST: actions ── */
export async function POST(request) {
  if (!verifyAdminToken(request)) return unauth();

  const { action } = await request.json().catch(() => ({}));

  if (action === "trigger-cron") {
    const result = await runDailySummaryCron("admin-manual");
    return NextResponse.json(
      { triggered: true, result },
      { status: result.success || result.skipped ? 200 : 500 },
    );
  }

  if (action === "clear-cache") {
    const t = new Date().toISOString().slice(0, 10);
    await Promise.all(
      ["v5", "v4", "v3"].map((v) =>
        redis.del(`daily-summary-${v}:${t}`).catch(() => {}),
      ),
    );
    return NextResponse.json({ cleared: true });
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
