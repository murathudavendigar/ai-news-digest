
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const TTL_SECONDS = 7 * 24 * 60 * 60; 
const KEY_PREFIX = "summary:";

function buildKey(articleId) {
  return KEY_PREFIX + articleId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function getCachedSummary(articleId) {
  try {
    const data = await redis.get(buildKey(articleId));
    return data ?? null;
  } catch (err) {
    console.error("[summaryCache] GET error:", err);
    return null;
  }
}

export async function setCachedSummary(articleId, summaryData) {
  try {
    await redis.set(buildKey(articleId), summaryData, { ex: TTL_SECONDS });
  } catch (err) {
    console.error("[summaryCache] SET error:", err);
  }
}

export async function invalidateCachedSummary(articleId) {
  try {
    await redis.del(buildKey(articleId));
  } catch (err) {
    console.error("[summaryCache] DEL error:", err);
  }
}

export async function getCacheStats() {
  try {
    const keys = await redis.keys(KEY_PREFIX + "*");
    return { total: keys.length, prefix: KEY_PREFIX };
  } catch (err) {
    console.error("[summaryCache] STATS error:", err);
    return { total: 0 };
  }
}
