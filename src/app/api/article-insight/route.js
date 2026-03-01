// api/article-insight/route.js
// Tek istekte hem summarize hem analyze çalıştırır.
// Önce her iki cache'i kontrol eder; cache miss olan kısımları paralel üretir.
// AISummary bu endpoint'i çağırır → ArticleAnalysis otomatik cache HIT alır.

import { analyzeArticle } from "@/app/lib/analyzeArticle";
import { summarizeArticle } from "@/app/lib/summarizeArticle";
import { getCachedSummary, setCachedSummary } from "@/app/lib/summaryCache";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

// In-flight dedup per article
const inFlight = new Map();

async function dedup(key, fn) {
  if (inFlight.has(key)) return inFlight.get(key);
  const p = fn().finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { article, forceLanguage, fast = false, forceRefresh = false } = body;

    if (!article?.title || !article?.sourceUrl) {
      return NextResponse.json(
        { error: "Missing required fields: title and sourceUrl" },
        { status: 400 },
      );
    }

    const articleId = article.articleId; // camelCase (from AISummary's articleContext)

    // analyzeArticle expects article_id (snake_case) — bridge
    const articleForAnalyze = articleId
      ? { ...article, article_id: articleId }
      : article;

    // ── 1. Cache check (paralel) ─────────────────────────────────────────
    const analyzeCacheKey = `analyze:${articleId}`;
    const [cachedSummary, cachedAnalysis] = await Promise.all([
      articleId && !forceRefresh
        ? getCachedSummary(articleId).catch(() => null)
        : null,
      articleId && !forceRefresh
        ? redis.get(analyzeCacheKey).catch(() => null)
        : null,
    ]);

    const summaryHit = !!cachedSummary;
    const analysisHit = !!cachedAnalysis;

    console.log(
      `[article-insight] ${articleId} — summary:${summaryHit ? "HIT" : "MISS"} analyze:${analysisHit ? "HIT" : "MISS"}`,
    );

    // ── 2. Parallel AI calls for misses ─────────────────────────────────
    const [summaryResult, analysisResult] = await Promise.all([
      summaryHit
        ? Promise.resolve({ ...cachedSummary, fromCache: true })
        : dedup(`summary:${articleId}`, () =>
            summarizeArticle(article, { forceLanguage, fast }),
          ),
      analysisHit
        ? Promise.resolve({ ...cachedAnalysis, fromCache: true })
        : dedup(`analyze:${articleId}`, () =>
            analyzeArticle(articleForAnalyze, forceRefresh),
          ),
    ]);

    // ── 3. Persist new results ───────────────────────────────────────────
    if (articleId && !summaryHit) {
      await setCachedSummary(articleId, summaryResult).catch(() => {});
    }
    // analyzeArticle already writes its own cache — nothing to do for analysis

    return NextResponse.json({
      // Summary fields (for AISummary component)
      ...summaryResult,
      fromCache: summaryHit,
      // Analysis available for ArticleAnalysis pre-warming (not used by AISummary)
      _analysisCacheWarmed: true,
    });
  } catch (error) {
    console.error("[POST /api/article-insight] Error:", error);
    return NextResponse.json(
      { error: "Analiz yapılamadı. Lütfen tekrar deneyin." },
      { status: 500 },
    );
  }
}
