import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const columnistSlug = searchParams.get("columnist");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

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

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
