import { fetchRSS } from "@/app/lib/rssParser";
import { RSS_SOURCES } from "@/app/lib/rssSources";
import { redis } from "@/app/lib/redis";
import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

const DISABLED_KEY = "rss:disabled";
const HEALTH_KEY = "rss:health:last";
const CURSOR_KEY = "rss:health:cursor";
/** Hobby 60s — günde ~18 kaynak rotasyon (tüm liste ~5 günde tur) */
const BATCH_SIZE = 18;

/**
 * Vercel Cron: RSS sağlık taraması (rotasyonlu batch).
 * 3 ardışık empty/error → kaynağı disabled sete ekle.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const failCounts =
    (await redis.get("rss:fail-counts").catch(() => null)) || {};
  const counts =
    typeof failCounts === "string" ? JSON.parse(failCounts) : { ...failCounts };

  const results = [];
  const newlyDisabled = [];
  const recovered = [];

  const ranked = [...RSS_SOURCES]
    .filter((s) => s.enabled !== false)
    .sort((a, b) => a.priority - b.priority);

  let cursor = Number((await redis.get(CURSOR_KEY).catch(() => 0)) || 0);
  if (!Number.isFinite(cursor) || cursor < 0) cursor = 0;
  cursor = cursor % Math.max(ranked.length, 1);

  const batch = [];
  for (let i = 0; i < Math.min(BATCH_SIZE, ranked.length); i++) {
    batch.push(ranked[(cursor + i) % ranked.length]);
  }
  const nextCursor = (cursor + batch.length) % Math.max(ranked.length, 1);

  for (const source of batch) {
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
        results.push({
          id: source.id,
          status: "empty",
          fails: counts[source.id],
        });
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

  const prevDisabled = await redis.smembers(DISABLED_KEY).catch(() => []);
  const disabled = [
    ...new Set([...(prevDisabled || []), ...newlyDisabled]),
  ];
  const stillDisabled = disabled.filter(
    (id) => !recovered.includes(id) && (counts[id] || 0) >= 3,
  );

  await redis.del(DISABLED_KEY).catch(() => {});
  if (stillDisabled.length) {
    await redis.sadd(DISABLED_KEY, ...stillDisabled).catch(() => {});
  }
  await redis
    .set("rss:fail-counts", counts, { ex: 7 * 24 * 3600 })
    .catch(() => {});
  await redis.set(CURSOR_KEY, nextCursor, { ex: 30 * 24 * 3600 }).catch(() => {});
  await redis
    .set(
      HEALTH_KEY,
      {
        at: new Date().toISOString(),
        batchSize: batch.length,
        cursor,
        nextCursor,
        ok: results.filter((r) => r.status === "ok").length,
        empty: results.filter((r) => r.status === "empty").length,
        error: results.filter((r) => r.status === "error").length,
        disabled: stillDisabled,
        checked: batch.map((s) => s.id),
      },
      { ex: 7 * 24 * 3600 },
    )
    .catch(() => {});

  return NextResponse.json({
    ok: true,
    cursor,
    nextCursor,
    batch: batch.map((s) => s.id),
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
