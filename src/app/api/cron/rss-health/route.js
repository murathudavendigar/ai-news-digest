import { fetchRSS } from "@/app/lib/rssParser";
import { RSS_SOURCES } from "@/app/lib/rssSources";
import { redis } from "@/app/lib/redis";
import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

const DISABLED_KEY = "rss:disabled";
const HEALTH_KEY = "rss:health:last";

/**
 * Vercel Cron: RSS sağlık taraması.
 * 3 ardışık empty/error → kaynağı disabled sete ekle.
 * İyileşen kaynakları setten çıkar.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const failCounts =
    (await redis.get("rss:fail-counts").catch(() => null)) || {};
  const counts =
    typeof failCounts === "string" ? JSON.parse(failCounts) : failCounts;

  const results = [];
  const newlyDisabled = [];
  const recovered = [];

  // Batch to avoid timeout — priority 1-2 first, then 3
  const sources = [...RSS_SOURCES].sort((a, b) => a.priority - b.priority);

  for (const source of sources) {
    if (source.enabled === false) continue;
    try {
      const articles = await fetchRSS(source);
      const ok = articles.length > 0;
      if (ok) {
        if (counts[source.id]) {
          delete counts[source.id];
          recovered.push(source.id);
        }
        results.push({ id: source.id, status: "ok", count: articles.length });
      } else {
        counts[source.id] = (counts[source.id] || 0) + 1;
        results.push({ id: source.id, status: "empty", fails: counts[source.id] });
        if (counts[source.id] >= 3) newlyDisabled.push(source.id);
      }
    } catch (err) {
      counts[source.id] = (counts[source.id] || 0) + 1;
      results.push({
        id: source.id,
        status: "error",
        error: err.message,
        fails: counts[source.id],
      });
      if (counts[source.id] >= 3) newlyDisabled.push(source.id);
    }
  }

  const disabled = [...new Set([...(await redis.smembers(DISABLED_KEY).catch(() => [])), ...newlyDisabled])];
  // Remove recovered
  const stillDisabled = disabled.filter((id) => !recovered.includes(id) && (counts[id] || 0) >= 3);

  await redis.del(DISABLED_KEY).catch(() => {});
  if (stillDisabled.length) {
    await redis.sadd(DISABLED_KEY, ...stillDisabled).catch(() => {});
  }
  await redis.set("rss:fail-counts", counts, { ex: 7 * 24 * 3600 }).catch(() => {});
  await redis
    .set(
      HEALTH_KEY,
      {
        at: new Date().toISOString(),
        ok: results.filter((r) => r.status === "ok").length,
        empty: results.filter((r) => r.status === "empty").length,
        error: results.filter((r) => r.status === "error").length,
        disabled: stillDisabled,
      },
      { ex: 7 * 24 * 3600 },
    )
    .catch(() => {});

  return NextResponse.json({
    ok: true,
    disabled: stillDisabled,
    recovered,
    summary: {
      total: results.length,
      ok: results.filter((r) => r.status === "ok").length,
      empty: results.filter((r) => r.status === "empty").length,
      error: results.filter((r) => r.status === "error").length,
    },
  });
}
