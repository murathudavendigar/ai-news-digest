import { summarizeArticle } from "@/app/lib/summarizeArticle";
import {
  getCachedSummary,
  invalidateCachedSummary,
  setCachedSummary,
} from "@/app/lib/summaryCache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

    // ── 2. Cache miss → call Groq ─────────────────────────────────────────
    console.log(`[summarize] Cache MISS for ${articleId} — calling Groq`);
    const result = await summarizeArticle(article, { forceLanguage, fast });

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
