import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

export async function GET(request, { params }) {
  try {
    const { columnistSlug, columnSlug } = await params;
    
    const cacheKey = `column:${columnistSlug}:${columnSlug}`;
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) return NextResponse.json(cached);

    // Get columnist id
    const { data: col } = await supabase
      .from("columnists")
      .select("*")
      .eq("slug", columnistSlug)
      .single();

    if (!col) {
      return NextResponse.json(
        { error: "Columnist not found" },
        { status: 404 },
      );
    }

    const { data, error } = await supabase
      .from("columns")
      .select("*")
      .eq("slug", columnSlug)
      .eq("columnist_id", col.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const responseData = { ...data, columnist: col };
    await redis.set(cacheKey, responseData, { ex: 3600 }).catch(() => {});
    return NextResponse.json(responseData);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
