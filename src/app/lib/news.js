import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const BASE_URL = "https://newsdata.io/api/1";

// ── API Key Havuzu ───────────────────────────────────────────────────────────
// NEWSDATA_API_KEYS=key1,key2,key3  (virgülle ayrılmış)
// Geriye dönük uyumluluk: tek key için NEWSDATA_API_KEY de destekleniyor.

function getKeyPool() {
  const multi = process.env.NEWSDATA_API_KEYS;
  if (multi)
    return multi
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  const single = process.env.NEWSDATA_API_KEY;
  return single ? [single] : [];
}

const EXHAUSTED_PREFIX = "newsdata:exhausted:"; // key → "1" w/ 24h TTL
const EXHAUSTED_TTL = 24 * 60 * 60; // 24 saat (günlük limit sıfırlanır)

async function getActiveKey() {
  const pool = getKeyPool();
  if (!pool.length)
    throw new Error("NEWSDATA_API_KEYS veya NEWSDATA_API_KEY tanımlı değil");

  for (const key of pool) {
    try {
      const exhausted = await redis.get(`${EXHAUSTED_PREFIX}${key.slice(-6)}`);
      if (!exhausted) return key;
    } catch {
      return key; // Redis hatası → key'i kullanılabilir say
    }
  }
  // Tüm key'ler tükendi
  throw new Error("Tüm NewsData API key'leri günlük limitine ulaştı");
}

async function markKeyExhausted(key) {
  try {
    await redis.set(`${EXHAUSTED_PREFIX}${key.slice(-6)}`, "1", {
      ex: EXHAUSTED_TTL,
    });
    console.warn(
      `[news] API key (…${key.slice(-6)}) tükendi, 24 saat devre dışı.`,
    );
  } catch {}
}

// newsdata.io limit hatalarını tespit et
function isLimitError(status, data) {
  if (status === 402 || status === 429) return true;
  const code = data?.results?.code || data?.code || "";
  return ["LimitReached", "RateLimitExceeded", "DailyLimitReached"].includes(
    code,
  );
}

// TTL'ler — haberlerin ne kadar süre cache'de kalacağı
const TTL = {
  latest: 5 * 60, // 5 dakika
  category: 5 * 60,
  article: 24 * 60 * 60, // 24 saat
  search: 2 * 60,
};

// ── Cache helpers ────────────────────────────────────────────────────────────

async function getCache(key) {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

async function setCache(key, data, ttlSeconds) {
  try {
    await redis.set(key, data, { ex: ttlSeconds });
  } catch (err) {
    console.error("[news cache] SET error:", err);
  }
}

// ── API helpers ──────────────────────────────────────────────────────────────
// buildUrl: apiKey içermeyen URL alır, key havuzunu deneyerek çağırır

async function fetchWithKeyFallback(buildUrl) {
  const pool = getKeyPool();
  if (!pool.length)
    throw new Error("NEWSDATA_API_KEYS veya NEWSDATA_API_KEY tanımlı değil");

  for (const key of pool) {
    // Bu key tükenmiş mi?
    try {
      const exhausted = await redis.get(`${EXHAUSTED_PREFIX}${key.slice(-6)}`);
      if (exhausted) continue;
    } catch {}

    const url = `${buildUrl}&apiKey=${key}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      let data = {};
      try {
        data = await res.json();
      } catch {}
      if (isLimitError(res.status, data)) {
        await markKeyExhausted(key);
        continue; // sonraki key'i dene
      }
      throw new Error(`NewsData API hatası: ${res.status}`);
    }

    return res.json();
  }

  throw new Error("Tüm NewsData API key'leri günlük limitine ulaştı");
}

// ── Public functions ─────────────────────────────────────────────────────────

export async function getLatest(language = "tr", nextPage = null) {
  const cacheKey = `news:latest:${language}:${nextPage || "first"}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/latest?language=${language}${nextPage ? `&page=${nextPage}` : ""}`;
  const data = await fetchWithKeyFallback(url);
  await setCache(cacheKey, data, TTL.latest);
  return data;
}

export async function getNewsByCategory(category, language = "tr") {
  const cacheKey = `news:category:${category}:${language}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/latest?language=${language}&category=${category}`;
  const data = await fetchWithKeyFallback(url);
  await setCache(cacheKey, data, TTL.category);
  return data;
}

export async function getNewsByArticleID(id) {
  const cacheKey = `news:article:${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/latest?id=${id}`;
  const data = await fetchWithKeyFallback(url);
  await setCache(cacheKey, data, TTL.article);
  return data;
}

export async function searchNews(query) {
  const cacheKey = `news:search:${encodeURIComponent(query)}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/latest?q=${encodeURIComponent(query)}&language=tr`;
  const data = await fetchWithKeyFallback(url);
  await setCache(cacheKey, data, TTL.search);
  return data;
}

// ── Utils ────────────────────────────────────────────────────────────────────

export function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Az önce";
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
