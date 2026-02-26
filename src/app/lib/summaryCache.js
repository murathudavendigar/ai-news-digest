import { kv } from "@vercel/kv";

const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 gün
const KEY_PREFIX = "summary:";

function buildKey(articleId) {
  return KEY_PREFIX + articleId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function getCachedSummary(articleId) {
  try {
    const data = await kv.get(buildKey(articleId));
    return data ?? null;
  } catch (err) {
    console.error("[summaryCache] GET error:", err);
    return null;
  }
}

export async function setCachedSummary(articleId, summaryData) {
  try {
    await kv.set(buildKey(articleId), summaryData, { ex: TTL_SECONDS });
  } catch (err) {
    console.error("[summaryCache] SET error:", err);
  }
}

export async function invalidateCachedSummary(articleId) {
  try {
    await kv.del(buildKey(articleId));
  } catch (err) {
    console.error("[summaryCache] DEL error:", err);
  }
}

export async function getCacheStats() {
  try {
    const keys = await kv.keys(KEY_PREFIX + "*");
    return { total: keys.length, prefix: KEY_PREFIX };
  } catch (err) {
    console.error("[summaryCache] STATS error:", err);
    return { total: 0 };
  }
}
