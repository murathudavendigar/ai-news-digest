import { analyzeArticle } from "@/app/lib/analyzeArticle";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// İn-flight dedup: aynı article için eş zamanlı istek gelirse beklet.
const inFlight = new Map();

async function dedup(key, fn) {
  if (inFlight.has(key)) return inFlight.get(key);
  const p = fn().finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

export async function POST(req) {
  try {
    const { article, forceRefresh = false } = await req.json();

    if (!article?.article_id || !article?.title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const run = () => analyzeArticle(article, forceRefresh);
    const result =
      article.article_id && !forceRefresh
        ? await dedup(article.article_id, run)
        : await run();
    return NextResponse.json(result, {
      headers: { "x-cache": result.fromCache ? "HIT" : "MISS" },
    });
  } catch (err) {
    console.error("[POST /api/analyze] Error:", err);
    return NextResponse.json({ error: "Analiz yapılamadı." }, { status: 500 });
  }
}
