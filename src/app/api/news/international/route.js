// GET /api/news/international
// Query params:
//   ?category=dunya|ekonomi (optional filter)
//   ?limit=20 (default 20, max 50)
//   ?refresh=true (force cache refresh, admin only)

import { fetchInternationalNews } from "@/app/lib/fetchInternationalNews";

export const runtime = "nodejs"; // NOT edge — needs full Node.js for RSS parsing

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const forceRefresh = searchParams.get("refresh") === "true";

    // Auth check for force refresh
    if (forceRefresh) {
      const auth = request.headers.get("authorization");
      const secret = process.env.CRON_SECRET;
      // also check NEXT_PUBLIC for safety if admin calls from client
      const secretPublic = process.env.NEXT_PUBLIC_CRON_SECRET;
      if (auth !== `Bearer ${secret}` && auth !== `Bearer ${secretPublic}`) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    let articles = await fetchInternationalNews({ forceRefresh });

    if (category) {
      articles = articles.filter((a) => a.category === category);
    }

    return Response.json({
      articles: articles.slice(0, limit),
      total: articles.length,
      cached: !forceRefresh,
    });
  } catch (err) {
    console.error("[api/news/international]", err);
    return Response.json(
      { error: "Failed to fetch international news" },
      { status: 500 }
    );
  }
}
