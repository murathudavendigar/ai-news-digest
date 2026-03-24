import { supabaseAdmin } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { columnist_slug, action } = body;

    if (!columnist_slug || !["follow", "unfollow"].includes(action)) {
      return NextResponse.json({ error: "Invalid params" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("columnist_follows")
      .insert([{ columnist_slug, action }]);

    if (error) {
      console.error("[follow] Insert error:", error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[follow] Unexpected error:", err.message);
    return NextResponse.json({ ok: true }); // non-fatal
  }
}
