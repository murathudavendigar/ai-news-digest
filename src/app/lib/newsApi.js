import { Redis } from "@upstash/redis";

const API_KEY = process.env.NEWSAPI_API_KEY;
const BASE_URL = "https://newsapi.org/v2";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const TTL = 2 * 60; // 2 dakika (arama sonuçları)

// ── Normalize ────────────────────────────────────────────────────────────────
// NewsAPI makalesini NewsData formatına çevirir
// Böylece compareArticles.js tek bir formatta çalışır

export function normalizeNewsAPIArticle(article) {
  return {
    article_id: Buffer.from(article.url).toString("base64").slice(0, 40),
    title: article.title,
    description: article.description,
    link: article.url,
    image_url: article.urlToImage,
    source_name: article.source?.name,
    source_id: article.source?.id,
    source_icon: null, // NewsAPI logo sağlamıyor
    pubDate: article.publishedAt,
    language: "en", // NewsAPI.org ağırlıklı İngilizce
    category: [],
    keywords: [],
    _provider: "newsapi", // Kaynağı işaretliyoruz
  };
}

// ── Search ───────────────────────────────────────────────────────────────────

export async function searchNewsAPI(query, options = {}) {
  const { pageSize = 5, language = "en", sortBy = "relevancy" } = options;

  const cacheKey = `newsapi:search:${encodeURIComponent(query)}:${language}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return cached;
  } catch {}

  const params = new URLSearchParams({
    q: query,
    pageSize: String(pageSize),
    sortBy,
    apiKey: API_KEY,
  });

  // Dil filtresi — TR haber arıyorsak dil kısıtlaması koyma, uluslararası kaynak istiyoruz
  if (language !== "any") {
    params.set("language", language);
  }

  const url = `${BASE_URL}/everything?${params}`;

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const err = await res.json();
      console.error("[newsapi] API error:", err.message);
      return { articles: [] };
    }

    const data = await res.json();
    const normalized = {
      articles: (data.articles || [])
        .filter((a) => a.title && a.title !== "[Removed]" && a.description)
        .map(normalizeNewsAPIArticle),
    };

    try {
      await redis.set(cacheKey, normalized, { ex: TTL });
    } catch {}

    return normalized;
  } catch (err) {
    console.error("[newsapi] Fetch error:", err);
    return { articles: [] };
  }
}
