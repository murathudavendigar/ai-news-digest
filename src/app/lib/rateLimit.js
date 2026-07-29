import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

/**
 * Basit sliding window rate limit (Redis INCR).
 * @returns {{ ok: boolean, remaining: number }}
 */
export async function checkRateLimit(
  key,
  { limit = 30, windowSec = 60 } = {},
) {
  const redisKey = `rl:${key}`;
  try {
    const n = await redis.incr(redisKey);
    if (n === 1) await redis.expire(redisKey, windowSec);
    return { ok: n <= limit, remaining: Math.max(0, limit - n), count: n };
  } catch {
    // Redis yoksa limiti atla — uygulamayı kilitleme
    return { ok: true, remaining: limit, count: 0 };
  }
}

export function clientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anon"
  );
}
