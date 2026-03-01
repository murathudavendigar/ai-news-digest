// api/related-news/route.js
// Mevcut haberin keyword'leriyle alakalı haberleri bul.
// Yeni API çağrısı yapmadan Redis'te cached olan son haberleri tarar.
// Cache miss ise NewsData arama API'sini kullanır.

import { searchNews } from "@/app/lib/news";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

export async function POST(req) {
  try {
    const { keywords = [], currentId, title } = await req.json();

    if (!keywords.length && !title) {
      return NextResponse.json({ articles: [] });
    }

    // Arama terimi: ilk 2 keyword, yoksa başlığın ilk 4 kelimesi
    const query =
      keywords.slice(0, 2).join(" ") ||
      (title || "").split(" ").slice(0, 4).join(" ");

    if (!query.trim()) return NextResponse.json({ articles: [] });

    redis.incr("stats:api:related-news:calls").catch(() => {});
    const data = await searchNews(query);

    // Mevcut haberi çıkar, en fazla 4 tane döndür
    const related = (data.results || [])
      .filter((a) => a.article_id !== currentId)
      .slice(0, 4);

    return NextResponse.json({ articles: related, query });
  } catch (error) {
    console.error("[POST /api/related-news] Error:", error);
    return NextResponse.json({ articles: [] });
  }
}
