import { summarizeArticle } from "@/app/lib/summarizeArticle";
import {
  getCachedSummary,
  invalidateCachedSummary,
  setCachedSummary,
} from "@/app/lib/summaryCache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// İn-flight dedup: aynı article için eş zamanlı istek gelirse beklet, tekrar AI çağrısı yapma.
const inFlight = new Map();

async function dedup(key, fn) {
  if (inFlight.has(key)) {
    console.log(`[summarize] In-flight HIT for ${key}`);
    return inFlight.get(key);
  }
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

    // article_id is required for caching
    const articleId = article.articleId;

    // ── 1. Cache check (skip if forceRefresh) ─────────────────────────────
    if (articleId && !forceRefresh) {
      const cached = await getCachedSummary(articleId);
      if (cached) {
        console.log(`[summarize] Cache HIT for ${articleId}`);
        return NextResponse.json({ ...cached, fromCache: true });
      }
    }

    // ── 2. Cache miss → call AI ──────────────────────────────────────────
    console.log(`[summarize] Cache MISS for ${articleId} — calling AI`);
    const summarize = () => summarizeArticle(article, { forceLanguage, fast });
    const result = articleId
      ? await dedup(articleId, summarize)
      : await summarize();

    // ── 3. Save to cache ──────────────────────────────────────────────────
    if (articleId) {
      if (forceRefresh) await invalidateCachedSummary(articleId);
      await setCachedSummary(articleId, result);
    }

    return NextResponse.json({ ...result, fromCache: false });
  } catch (error) {
    console.error("[POST /api/summarize] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary. Please try again." },
      { status: 500 },
    );
  }
}
