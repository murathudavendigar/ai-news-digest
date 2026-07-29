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
const ARTICLE_CACHE_TTL = 7 * 24 * 3600; // 7 gün — makale detayı
const LOCK_TTL_SEC = 120;
const STALE_MS = 10 * 60 * 1000;

/** Cron warmer — kritik feed'ler (Hobby günde 1) */
export const WARM_FEED_CATEGORIES = [
  null, // all / homepage
  "politics",
  "world",
  "business",
  "sports",
  "technology",
  "health",
];

function feedKey(category) {
  return `rss:feed:${category || "all"}:full:v2`;
}

function lockKey(fullKey) {
  return `rss:lock:${fullKey}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Makaleyi Redis'e kaydet (detay sayfası için) ──────────────────────────
async function cacheArticles(articles) {
  if (!articles.length) return;
  const categoryMap = {};
  const ops = articles.map((a) => {
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
      redis
        .set(`article:slug:${a.slug}`, a, { ex: ARTICLE_CACHE_TTL })
        .catch(() => {});
    }
    return redis.set(`article:${a.article_id}`, a, { ex: ARTICLE_CACHE_TTL });
  });
  await Promise.allSettled(ops);
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
  for (let i = 0; i < 2 && typeof value === "string"; i++) {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value && typeof value === "object" ? value : null;
}

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

export async function getArticleForDetail(id) {
  const cached = await getArticleById(id);
  if (cached) return normalizeArticle(cached);

  try {
    const data = await getNewsByArticleID(id);
    const article = data.results?.[0] ?? null;
    return article ? normalizeArticle(article) : null;
  } catch {
    return null;
  }
}

export async function findRelatedInFeed(query, currentId, limit = 4) {
  if (!query?.trim()) return [];

  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  if (!queryWords.length) return [];

  const feedKeys = [
    "rss:feed:all:full:v2",
    "rss:feed:politics:full:v2",
    "rss:feed:world:full:v2",
  ];
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
          if (matches.length >= limit * 2) break;
        }
      }
    } catch {}
  }

  return matches
    .sort((a, b) => b._relScore - a._relScore)
    .slice(0, limit)
    .map(({ _relScore: _, ...a }) => normalizeArticle(a));
}

// ── Ana feed ─────────────────────────────────────────────────────────────
export async function getNewsFeed({ category, page = 1, pageSize = 30 } = {}) {
  const resolvedCategory =
    category === "domestic" || category === "gundem" ? "politics" : category;

  const fullKey = feedKey(resolvedCategory);

  try {
    const cached = await redis.get(fullKey);
    if (cached?.results) {
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      if (age > STALE_MS) {
        // stale — arka planda tek uçuş (lock içinde)
        rebuildFeedInBackground(resolvedCategory, fullKey);
      }
      return paginateFeed(cached, page, pageSize, true);
    }
  } catch {}

  const full = await buildFullFeed({
    category: resolvedCategory,
    fullKey,
  });
  return paginateFeed(full, page, pageSize, false);
}

function rebuildFeedInBackground(category, fullKey) {
  buildFullFeed({ category, fullKey, background: true }).catch(() => {});
}

function paginateFeed(full, page, pageSize, fromCache) {
  const articles = full?.results || [];
  const start = (page - 1) * pageSize;
  const pageData = articles.slice(start, start + pageSize);
  return {
    results: pageData,
    totalCount: articles.length,
    nextPage: articles.length > start + pageSize ? page + 1 : null,
    source: full?.source || "rss",
    fetchedAt: full?.fetchedAt || null,
    fromCache,
  };
}

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

/**
 * Single-flight rebuild — aynı fullKey için paralel rebuild engellenir.
 */
export async function buildFullFeed({
  category,
  fullKey,
  background = false,
} = {}) {
  const key = fullKey || feedKey(category);
  const lk = lockKey(key);

  let acquired = false;
  try {
    const got = await redis.set(lk, String(Date.now()), {
      nx: true,
      ex: LOCK_TTL_SEC,
    });
    acquired = Boolean(got);
  } catch {
    acquired = true; // Redis yoksa kilitsiz devam
  }

  if (!acquired) {
    // Başka worker çalışıyor — cache dolmasını bekle
    for (let i = 0; i < 10; i++) {
      await sleep(400);
      try {
        const cached = await redis.get(key);
        if (cached?.results?.length) return cached;
      } catch {}
    }
    if (background) {
      return { results: [], source: "rss", fetchedAt: new Date().toISOString() };
    }
    // Cold path: hâlâ boşsa yine de dene (kilidi beklemeden — nadir)
  }

  try {
    return await buildFullFeedUnlocked({ category, fullKey: key });
  } finally {
    if (acquired) {
      await redis.del(lk).catch(() => {});
    }
  }
}

async function buildFullFeedUnlocked({ category, fullKey }) {
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

/**
 * Kritik feed'leri ısıt (cron). Zaman bütçesi ~50s — kalanlar sonraki güne.
 */
export async function warmCriticalFeeds({ budgetMs = 50_000 } = {}) {
  const started = Date.now();
  const out = [];

  for (const category of WARM_FEED_CATEGORIES) {
    if (Date.now() - started > budgetMs) {
      out.push({
        category: category || "all",
        skipped: true,
        reason: "time_budget",
      });
      continue;
    }
    const fullKey = feedKey(category);
    try {
      const full = await buildFullFeed({ category, fullKey });
      out.push({
        category: category || "all",
        count: full.results?.length || 0,
        source: full.source,
        ms: Date.now() - started,
      });
    } catch (err) {
      out.push({
        category: category || "all",
        error: err.message,
      });
    }
  }

  return { warmed: out, elapsedMs: Date.now() - started };
}
