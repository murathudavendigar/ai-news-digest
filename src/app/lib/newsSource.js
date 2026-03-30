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
import { getAllSources, getSourcesByCategory } from "./rssSources";
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
    (a.category || []).forEach((cat) => {
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

// ── ID ile makale getir ───────────────────────────────────────────────────
export async function getArticleById(id) {
  try {
    let cached = await redis.get(`article:${id}`);
    if (cached) return cached;
    cached = await redis.get(`article:slug:${id}`);
    if (cached) return cached;
  } catch {}
  return null;
}

// ── Detay sayfası için makale getir (RSS cache → NewsData fallback) ───────
// Her iki kaynaktan gelen makaleyi tek formata normalize eder.
export async function getArticleForDetail(id) {
  // 1. RSS / feed cache (en hızlı, API harcamaz)
  const cached = await getArticleById(id);
  if (cached) return cached;

  // 2. NewsData API fallback — eski haberler veya doğrudan paylaşılan linkler
  try {
    const data = await getNewsByArticleID(id);
    return data.results?.[0] ?? null;
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

  const feedKeys = ["rss:feed:all:p1", "rss:feed:all:p2"];
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

  // En fazla eşleşen önce
  return matches
    .sort((a, b) => b._relScore - a._relScore)
    .slice(0, limit)
    .map(({ _relScore: _, ...a }) => a); // _relScore'u döndürme
}

// ── Ana feed ─────────────────────────────────────────────────────────────
export async function getNewsFeed({ category, page = 1, pageSize = 30 } = {}) {
  const cacheKey = `rss:feed:${category || "all"}:p${page}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      // ─ Stale-while-revalidate ─────────────────────────────────────
      // Cache veri eskiyse arka planda yenile, mevcut isteğe stale dön
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      if (age > 10 * 60 * 1000) {
        // 10 dakikadan eski → sessizce yenile
        getNewsFeedFresh({ category, page, pageSize, cacheKey }).catch(
          () => {},
        );
      }
      return { ...cached, fromCache: true };
    }
  } catch {}

  return getNewsFeedFresh({ category, page, pageSize, cacheKey });
}

// ── Kaynak round-robin dağıtımı ───────────────────────────────────────────
// Aynı kaynaktan gelen haberler arka arkaya gelmesin.
// Her kaynaktan birer haber alarak yeni bir liste oluşturur.
function interleaveBySource(articles) {
  // Kaynağa göre grupla
  const groups = {};
  for (const a of articles) {
    const key = a.source_id || a.source_name || "unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }

  // Her gruptan en fazla haber olan önce sıralanır (büyükten küçüğe)
  const queues = Object.values(groups).sort((a, b) => b.length - a.length);
  const result = [];

  while (queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      if (q.length > 0) result.push(q.shift());
    }
  }

  return result;
}

async function getNewsFeedFresh({ category, page, pageSize, cacheKey }) {
  let articles = [];
  let source = "rss";

  // ── RSS ──────────────────────────────────────────────────────────────
  try {
    const sources = category
      ? getSourcesByCategory(category)
      : getAllSources()
          .filter((s) => s.priority <= 2)
          .slice(0, 12);

    console.log(
      `[newsSource] RSS: ${sources.length} kaynak, kategori: ${category || "all"}`,
    );
    const rawArticles = await fetchMultipleRSS(sources);
    articles = rawArticles.map(normalizeArticle);
    console.log(`[newsSource] RSS: ${articles.length} haber`);
  } catch (err) {
    console.error("[newsSource] RSS hatası:", err.message);
  }

  // ── NewsData fallback ─────────────────────────────────────────────────
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

  // Makaleleri Redis'e kaydet (arka planda, await etme)
  cacheArticles(articles).catch(() => {});

  // ── Kaynak karıştırma: aynı kaynağın haberleri arka arkaya gelmesin ──
  articles = interleaveBySource(articles);

  // Sayfalama
  const start = (page - 1) * pageSize;
  const pageData = articles.slice(start, start + pageSize);

  const result = {
    results: pageData,
    totalCount: articles.length,
    nextPage: articles.length > start + pageSize ? page + 1 : null,
    source,
    fetchedAt: new Date().toISOString(),
    fromCache: false,
  };

  try {
    await redis.set(cacheKey, result, { ex: FEED_CACHE_TTL });
  } catch {}
  return result;
}
