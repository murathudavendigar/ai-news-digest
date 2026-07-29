// app/api/news/route.js — RSS önce, NewsData fallback
import { getNewsFeed } from "@/app/lib/newsSource";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || null;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") || "30", 10) || 30),
  );

  try {
    const data = await getNewsFeed({ category, page, pageSize });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[news API]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
