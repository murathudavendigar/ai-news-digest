import { supabaseAdmin } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const { columnistSlug, columnSlug } = await params;

    if (!columnistSlug || !columnSlug) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    // Find the column
    const { data: col, error: fetchError } = await supabaseAdmin
      .from("columns")
      .select("id, columnist:columnist_id(slug)")
      .eq("slug", columnSlug)
      .maybeSingle();

    if (fetchError || !col) {
      return NextResponse.json({ ok: true }); // silent fail
    }

    // Verify columnist slug matches
    if (col.columnist?.slug !== columnistSlug) {
      return NextResponse.json({ ok: true });
    }

    // Increment atomically via RPC
    const { error: rpcError } = await supabaseAdmin.rpc(
      "increment_view_count",
      { p_column_id: col.id },
    );

    if (rpcError) {
      console.error("[view] RPC error:", rpcError.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[view] Unexpected error:", err.message);
    return NextResponse.json({ ok: true }); // never fail page load
  }
}
