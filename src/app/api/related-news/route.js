// api/related-news/route.js
// Mevcut haberin keyword'leriyle alakalı haberleri bul.
// Öncelik: RSS feed cache (API tüketimi yok) → NewsData search fallback

import { searchNews } from "@/app/lib/news";
import { findRelatedInFeed } from "@/app/lib/newsSource";
import { normalizeArticle } from "@/app/lib/newsUtils";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function buildRelatedQuery(title, keywords = []) {
  const titleWords = String(title || "")
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter((w) => w.length > 2)
    .slice(0, 6);
  if (titleWords.length >= 2) return titleWords.join(" ");

  const kw = (keywords || [])
    .filter((k) => typeof k === "string" && k.length > 2)
    .slice(0, 2);
  return kw.join(" ") || titleWords.join(" ");
}

export async function POST(req) {
  try {
    const { keywords = [], currentId, title } = await req.json();

    if (!keywords.length && !title) {
      return NextResponse.json({ articles: [] });
    }

    // Başlık önce — kategori keyword'leri (politics vb.) Türkçe RSS'te zayıf eşleşir
    const query = buildRelatedQuery(title, keywords);

    if (!query.trim()) return NextResponse.json({ articles: [] });

    // ── 1. RSS feed cache'inden tara (API çağrısı yok) ────────────────────
    const rssArticles = await findRelatedInFeed(query, currentId, 4);
    if (rssArticles.length >= 1) {
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
        .map(normalizeArticle)
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
