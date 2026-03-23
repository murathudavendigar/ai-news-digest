import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET(request, { params }) {
  try {
    const { columnistSlug, columnSlug } = await params;

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

    return NextResponse.json({ ...data, columnist: col });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
