import { NextResponse } from "next/server";
import { analyzeArticle } from "@/app/lib/analyzeArticle";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { article, forceRefresh = false } = await req.json();

    if (!article?.article_id || !article?.title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await analyzeArticle(article, forceRefresh);
    return NextResponse.json(result, {
      headers: { "x-cache": result.fromCache ? "HIT" : "MISS" },
    });
  } catch (err) {
    console.error("[POST /api/analyze] Error:", err);
    return NextResponse.json({ error: "Analiz yapılamadı." }, { status: 500 });
  }
}
