import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { supabaseAdmin } from "@/app/lib/supabase";

export async function POST(request) {
  try {
    const { reaction, sessionId } = await request.json();

    // Validate reaction
    if (!["fire", "clap", "think", "heart"].includes(reaction)) {
      return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId required" },
        { status: 400 },
      );
    }

    // Get column from URL params
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    // /api/columns/[columnistSlug]/[columnSlug]/react
    const columnSlug = pathParts[pathParts.length - 2];

    // Find the column
    const { data: column } = await supabase
      .from("columns")
      .select("id, reaction_counts")
      .eq("slug", columnSlug)
      .single();

    if (!column) {
      return NextResponse.json(
        { error: "Column not found" },
        { status: 404 },
      );
    }

    // Insert reaction (deduplicated by unique constraint)
    const { error: insertError } = await supabaseAdmin
      .from("column_reactions")
      .insert([
        {
          column_id: column.id,
          session_id: sessionId,
          reaction,
        },
      ]);

    if (insertError) {
      // 23505 = unique violation → already reacted
      if (insertError.code === "23505") {
        return NextResponse.json({
          message: "Already reacted",
          counts: column.reaction_counts,
        });
      }
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 },
      );
    }

    // Atomically increment reaction count
    const counts = column.reaction_counts || {
      fire: 0,
      clap: 0,
      think: 0,
      heart: 0,
    };
    counts[reaction] = (counts[reaction] || 0) + 1;

    await supabaseAdmin
      .from("columns")
      .update({ reaction_counts: counts })
      .eq("id", column.id);

    return NextResponse.json({ success: true, counts });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
