import { compareArticles } from "@/app/lib/compareArticles";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { article, forceRefresh = false } = await req.json();

    if (!article?.article_id || !article?.title) {
      return NextResponse.json(
        { error: "Missing required fields: article_id and title" },
        { status: 400 },
      );
    }

    const result = await compareArticles(article, forceRefresh);
    return NextResponse.json(result, {
      headers: { "x-cache": result.fromCache ? "HIT" : "MISS" },
    });
  } catch (err) {
    console.error("[POST /api/compare] Error:", err);
    return NextResponse.json(
      { error: "An error occurred while comparing articles." },
      { status: 500 },
    );
  }
}
