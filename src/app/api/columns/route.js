import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const columnistSlug = searchParams.get("columnist");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    const cacheKey = `columns:listing:${columnistSlug || 'all'}:${limit}:v1`;
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) return NextResponse.json(cached);

    let query = supabase
      .from("columns")
      .select(
        `*, columnist:columnist_id (name, slug, title, avatar_url, expertise)`,
      )
      .order("published_at", { ascending: false })
      .limit(limit);

    if (columnistSlug) {
      // Get columnist id first, then filter
      const { data: col } = await supabase
        .from("columnists")
        .select("id")
        .eq("slug", columnistSlug)
        .single();

      if (!col) {
        return NextResponse.json(
          { error: "Columnist not found" },
          { status: 404 },
        );
      }
      query = query.eq("columnist_id", col.id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await redis.set(cacheKey, data, { ex: 300 }).catch(() => {});

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
