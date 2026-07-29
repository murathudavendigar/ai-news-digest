// lib/newsSource.js
// Unified haber kaynağı — RSS önce, NewsData.io fallback
// Haberler Redis'e tek tek kaydedilir → detay sayfası ID ile bulabilir

import { Redis } from "@upstash/redis";
import {
  getLatest,
  getNewsByArticleID,
  getNewsByCategory as getNewsDataByCategory,
} from "./news";
import { fetchMultipleRSS } from "./rssParser";
import {
  getSourcesByCategoryAsync,
  pickSourcesForHomepageAsync,
} from "./rssSources";
import { normalizeArticle } from "./newsUtils";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const FEED_CACHE_TTL = 15 * 60; // 15 dk — feed listesi
const ARTICLE_CACHE_TTL = 7 * 24 * 3600; // 7 gün — makale detayı (48 saat yetersizdi)

// ── Makaleyi Redis'e kaydet (detay sayfası için) ──────────────────────────
async function cacheArticles(articles) {
  if (!articles.length) return;
  // Her makaleyi article:{id} olarak sakla + kategori index'lerini güncelle
  const categoryMap = {};
  const ops = articles.map((a) => {
    // Kategori index'i oluştur: rss:cat:{category} → article_id set
    const cats = Array.isArray(a.category)
      ? a.category
      : a.category
        ? [a.category]
        : [];
    cats.forEach((cat) => {
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push(a.article_id);
    });
    if (a.slug) {
      redis.set(`article:slug:${a.slug}`, a, { ex: ARTICLE_CACHE_TTL }).catch(() => {});
    }
    return redis.set(`article:${a.article_id}`, a, { ex: ARTICLE_CACHE_TTL });
  });
  await Promise.allSettled(ops);
  // Kategori setlerini güncelle (arka planda)
  Promise.allSettled(
    Object.entries(categoryMap).map(([cat, ids]) =>
      redis
        .sadd(`rss:cat:${cat}`, ...ids)
        .then(() => redis.expire(`rss:cat:${cat}`, ARTICLE_CACHE_TTL)),
    ),
  ).catch(() => {});
}

function coerceCachedArticle(cached) {
  if (!cached) return null;
  let value = cached;
  // Upstash bazen string, bazen object döner; eski intl kodu JSON.stringify yazıyordu
  for (let i = 0; i < 2 && typeof value === "string"; i++) {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value && typeof value === "object" ? value : null;
}

// ── ID ile makale getir ───────────────────────────────────────────────────
export async function getArticleById(id) {
  if (!id) return null;
  try {
    let cached = coerceCachedArticle(await redis.get(`article:${id}`));
    if (cached) return cached;
    cached = coerceCachedArticle(await redis.get(`article:slug:${id}`));
    if (cached) return cached;
  } catch {}
  return null;
}

// ── Detay sayfası için makale getir (RSS cache → NewsData fallback) ───────
// Her iki kaynaktan gelen makaleyi tek formata normalize eder.
export async function getArticleForDetail(id) {
  // 1. RSS / feed cache (en hızlı, API harcamaz)
  const cached = await getArticleById(id);
  if (cached) return normalizeArticle(cached); // Ensure normalized even from cache

  // 2. NewsData API fallback — eski haberler veya doğrudan paylaşılan linkler
  try {
    const data = await getNewsByArticleID(id);
    const article = data.results?.[0] ?? null;
    return article ? normalizeArticle(article) : null;
  } catch {
    return null;
  }
}

// ── RSS feed cache'inden alakalı makaleler bul ────────────────────────────
// API çağrısı yapmadan sadece Redis'teki aktif feed'leri tarar.
export async function findRelatedInFeed(query, currentId, limit = 4) {
  if (!query?.trim()) return [];

  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  if (!queryWords.length) return [];

  const feedKeys = ["rss:feed:all:full:v2"];
  const seen = new Set([currentId]);
  const matches = [];

  for (const key of feedKeys) {
    if (matches.length >= limit) break;
    try {
      const feed = await redis.get(key);
      if (!feed?.results) continue;
      for (const a of feed.results) {
        if (seen.has(a.article_id)) continue;
        const haystack = [a.title, a.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const score = queryWords.filter((w) => haystack.includes(w)).length;
        if (score > 0) {
          seen.add(a.article_id);
          matches.push({ ...a, _relScore: score });
          if (matches.length >= limit * 2) break; // fazla topla, sonra sırala
        }
      }
    } catch {}
  }

  // En fazla eşleşen önce — detay linkleri için normalize (slug/link)
  return matches
    .sort((a, b) => b._relScore - a._relScore)
    .slice(0, limit)
    .map(({ _relScore: _, ...a }) => normalizeArticle(a));
}

// ── Ana feed ─────────────────────────────────────────────────────────────
export async function getNewsFeed({ category, page = 1, pageSize = 30 } = {}) {
  // domestic / gundem → politics (RSS etiketleriyle uyumlu)
  const resolvedCategory =
    category === "domestic" || category === "gundem" ? "politics" : category;

  const fullKey = `rss:feed:${resolvedCategory || "all"}:full:v2`;

  try {
    const cached = await redis.get(fullKey);
    if (cached?.results) {
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      if (age > 10 * 60 * 1000) {
        // stale — arka planda yenile
        buildFullFeed({ category: resolvedCategory, fullKey }).catch(() => {});
      }
      return paginateFeed(cached, page, pageSize, true);
    }
  } catch {}

  const full = await buildFullFeed({ category: resolvedCategory, fullKey });
  return paginateFeed(full, page, pageSize, false);
}

function paginateFeed(full, page, pageSize, fromCache) {
  const articles = full.results || [];
  const start = (page - 1) * pageSize;
  const pageData = articles.slice(start, start + pageSize);
  return {
    results: pageData,
    totalCount: articles.length,
    nextPage: articles.length > start + pageSize ? page + 1 : null,
    source: full.source,
    fetchedAt: full.fetchedAt,
    fromCache,
  };
}

// ── Kaynak round-robin dağıtımı ───────────────────────────────────────────
function interleaveBySource(articles) {
  const groups = {};
  for (const a of articles) {
    const key = a.source_id || a.source_name || "unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }

  const queues = Object.values(groups).sort((a, b) => b.length - a.length);
  const result = [];

  while (queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      if (q.length > 0) result.push(q.shift());
    }
  }

  return result;
}

async function buildFullFeed({ category, fullKey }) {
  let articles = [];
  let source = "rss";

  try {
    const sources = category
      ? await getSourcesByCategoryAsync(category)
      : await pickSourcesForHomepageAsync({
          perCategory: 2,
          maxTotal: 18,
          maxPriority: 2,
        });

    console.log(
      `[newsSource] RSS: ${sources.length} kaynak, kategori: ${category || "all"}`,
    );
    const rawArticles = await fetchMultipleRSS(sources);
    articles = rawArticles.map(normalizeArticle);
    console.log(`[newsSource] RSS: ${articles.length} haber`);
  } catch (err) {
    console.error("[newsSource] RSS hatası:", err.message);
  }

  if (articles.length < 10) {
    console.log("[newsSource] Fallback: NewsData.io");
    try {
      const data = category
        ? await getNewsDataByCategory(category, "tr")
        : await getLatest("tr");
      const extra = (data.results || []).map((a) => ({
        ...a,
        _fromRSS: false,
      }));
      const rssKeys = new Set(
        articles.map((a) => a.title.slice(0, 50).toLowerCase()),
      );
      const fresh = extra
        .filter((a) => !rssKeys.has(a.title?.slice(0, 50).toLowerCase()))
        .map(normalizeArticle);
      articles = [...articles, ...fresh];
      source = articles.length > extra.length ? "hybrid" : "newsdata";
    } catch (err) {
      console.error("[newsSource] NewsData hatası:", err.message);
    }
  }

  cacheArticles(articles).catch(() => {});
  articles = interleaveBySource(articles);

  const full = {
    results: articles,
    source,
    fetchedAt: new Date().toISOString(),
  };

  try {
    await redis.set(fullKey, full, { ex: FEED_CACHE_TTL });
  } catch {}
  return full;
}
