// api/related-news/route.js
// Mevcut haberin keyword'leriyle alakalı haberleri bul.
// Öncelik: RSS feed cache (API tüketimi yok) → NewsData search fallback

import { searchNews } from "@/app/lib/news";
import { findRelatedInFeed } from "@/app/lib/newsSource";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { keywords = [], currentId, title } = await req.json();

    if (!keywords.length && !title) {
      return NextResponse.json({ articles: [] });
    }

    // Arama terimi: ilk 2 keyword, yoksa başlığın ilk 5 kelimesi
    const query =
      keywords.slice(0, 2).join(" ") ||
      (title || "").split(" ").slice(0, 5).join(" ");

    if (!query.trim()) return NextResponse.json({ articles: [] });

    // ── 1. RSS feed cache'inden tara (API çağrısı yok) ────────────────────
    const rssArticles = await findRelatedInFeed(query, currentId, 4);
    if (rssArticles.length >= 2) {
      return NextResponse.json({
        articles: rssArticles,
        query,
        source: "rss-cache",
      });
    }

    // ── 2. NewsData search fallback (RSS yetmezse) ─────────────────────────
    try {
      const data = await searchNews(query);
      const related = (data.results || [])
        .filter((a) => a.article_id !== currentId)
        .slice(0, 4);

      // RSS'den bulunanlarla birleştir (tekrar etmeden)
      const existingIds = new Set(rssArticles.map((a) => a.article_id));
      const merged = [
        ...rssArticles,
        ...related.filter((a) => !existingIds.has(a.article_id)),
      ].slice(0, 4);

      return NextResponse.json({ articles: merged, query, source: "newsdata" });
    } catch {
      // NewsData de başarısız olursa az da olsa RSS sonuçlarını döndür
      return NextResponse.json({
        articles: rssArticles,
        query,
        source: "rss-cache",
      });
    }
  } catch (error) {
    console.error("[POST /api/related-news] Error:", error);
    return NextResponse.json({ articles: [] });
  }
}
