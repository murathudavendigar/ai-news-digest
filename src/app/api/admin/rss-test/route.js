import { fetchRSS } from "@/app/lib/rssParser";
import { RSS_SOURCES } from "@/app/lib/rssSources";
import { NextResponse } from "next/server";
import { verifyAdminToken } from "../auth/route";

export async function GET(request) {
  if (!verifyAdminToken(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get("id");

  // Tek kaynak testi
  if (sourceId) {
    const source = RSS_SOURCES.find((s) => s.id === sourceId);
    if (!source)
      return NextResponse.json({ error: "Kaynak bulunamadı" }, { status: 404 });
    const t0 = Date.now();
    const articles = await fetchRSS(source);
    return NextResponse.json({
      source: source.name,
      url: source.url,
      count: articles.length,
      durationMs: Date.now() - t0,
      hasFullContent: articles.filter((a) => a._hasFullContent).length,
      hasImages: articles.filter((a) => a.image_url).length,
      sample: articles.slice(0, 2).map((a) => ({
        title: a.title,
        description: a.description?.slice(0, 200),
        hasFullContent: a._hasFullContent,
        image: !!a.image_url,
        pubDate: a.pubDate,
      })),
    });
  }

  // Tüm kaynakları test et
  const t0 = Date.now();
  const results = await Promise.all(
    RSS_SOURCES.map(async (source) => {
      const st = Date.now();
      try {
        const articles = await fetchRSS(source);
        return {
          id: source.id,
          name: source.name,
          priority: source.priority,
          status: articles.length > 0 ? "ok" : "empty",
          count: articles.length,
          fullContent: articles.filter((a) => a._hasFullContent).length,
          images: articles.filter((a) => a.image_url).length,
          durationMs: Date.now() - st,
        };
      } catch (err) {
        return {
          id: source.id,
          name: source.name,
          status: "error",
          error: err.message,
          count: 0,
          durationMs: Date.now() - st,
        };
      }
    }),
  );

  const ok = results.filter((r) => r.status === "ok");
  const empty = results.filter((r) => r.status === "empty");
  const error = results.filter((r) => r.status === "error");

  return NextResponse.json({
    summary: {
      total: results.length,
      ok: ok.length,
      empty: empty.length,
      error: error.length,
      totalArticles: ok.reduce((s, r) => s + r.count, 0),
      withFullContent: ok.reduce((s, r) => s + r.fullContent, 0),
      durationMs: Date.now() - t0,
    },
    results: results.sort(
      (a, b) => a.priority - b.priority || b.count - a.count,
    ),
  });
}
