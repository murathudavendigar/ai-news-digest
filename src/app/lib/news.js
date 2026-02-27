import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});
const API_KEY = process.env.NEWSDATA_API_KEY;
const BASE_URL = "https://newsdata.io/api/1";

// TTL'ler — haberlerin ne kadar süre cache'de kalacağı
const TTL = {
  latest: 5 * 60, // 5 dakika (ana sayfa haberleri sık değişir)
  category: 5 * 60, // 5 dakika
  article: 24 * 60 * 60, // 24 saat (tek haber değişmez)
  search: 2 * 60, // 2 dakika (arama sonuçları)
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

async function fetchFromAPI(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`NewsData API hatası: ${res.status}`);
  return res.json();
}

// ── Public functions ─────────────────────────────────────────────────────────

export async function getLatest(language = "tr", nextPage = null) {
  const cacheKey = `news:latest:${language}:${nextPage || "first"}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/latest?language=${language}&apiKey=${API_KEY}${nextPage ? `&page=${nextPage}` : ""}`;
  const data = await fetchFromAPI(url);
  await setCache(cacheKey, data, TTL.latest);
  return data;
}

export async function getNewsByCategory(category, language = "tr") {
  const cacheKey = `news:category:${category}:${language}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/latest?language=${language}&category=${category}&apiKey=${API_KEY}`;
  const data = await fetchFromAPI(url);
  await setCache(cacheKey, data, TTL.category);
  return data;
}

export async function getNewsByArticleID(id) {
  const cacheKey = `news:article:${id}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/latest?id=${id}&apiKey=${API_KEY}`;
  const data = await fetchFromAPI(url);
  await setCache(cacheKey, data, TTL.article);
  return data;
}

export async function searchNews(query) {
  const cacheKey = `news:search:${encodeURIComponent(query)}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/latest?q=${encodeURIComponent(query)}&language=tr&apiKey=${API_KEY}`;
  const data = await fetchFromAPI(url);
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
