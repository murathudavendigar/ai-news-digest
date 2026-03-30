import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase";
import { generateJSON, GEMINI_MODELS } from "@/app/lib/gemini";
import { devWarn } from "@/app/lib/devLog";

export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.NEXT_PUBLIC_CRON_SECRET || process.env.CRON_SECRET;

  if (!secret) {
    console.error("[backfill-polls] CRON_SECRET not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${secret}`) {
    console.warn("[backfill-polls] Unauthorized attempt:", authHeader?.slice(0, 20));
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get latest 5 columns that DO NOT have a poll
    const { data: colsWithoutPolls, error: fetchErr } = await supabaseAdmin
      .from("columns")
      .select("id, topic_summary, content, title")
      .order("published_at", { ascending: false })
      .limit(10); // Check recent 10

    if (fetchErr) throw fetchErr;
    if (!colsWithoutPolls || colsWithoutPolls.length === 0) {
      return NextResponse.json({ message: "No recent columns found" });
    }

    // Now check which actually lack polls
    const { data: polls } = await supabaseAdmin
      .from("column_polls")
      .select("column_id")
      .in(
        "column_id",
        colsWithoutPolls.map((c) => c.id)
      );

    const existingPollIds = new Set(polls?.map((p) => p.column_id) || []);
    const columnsToBackfill = colsWithoutPolls
      .filter((c) => !existingPollIds.has(c.id))
      .slice(0, 5); // backfill max 5 at a time to avoid limits

    if (columnsToBackfill.length === 0) {
      return NextResponse.json({ message: "No columns missing polls in latest batch" });
    }

    // Backfill
    const results = await Promise.allSettled(
      columnsToBackfill.map((col) =>
        generateJSON(
          `Bu köşe yazısının en tartışmalı noktasını baz alarak okuyucu anketi yaz.
           Soru tarafsız, 3 seçenek farklı bakış açıları, her seçenek max 8 kelime.
           Siyasi veya dinî yargı içermemeli.
           
           Yazı özeti: ${col.topic_summary}
           İçerik: ${col.content.slice(0, 2000)}
           
           Yanıt YALNIZCA JSON:
           {"question": "Soru?", "options": ["A", "B", "C"]}`,
          { model: GEMINI_MODELS.HIGH_SPEED, temperature: 0.3, label: "poll" }
        ).then(async (result) => {
          const { error } = await supabaseAdmin.from("column_polls").insert({
            column_id: col.id,
            question: result.question,
            options: result.options,
          });
          if (error) throw error;
          return col.id;
        })
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({
      message: `Backfilled ${successful} out of ${columnsToBackfill.length} columns`,
    });
  } catch (err) {
    devWarn("[backfill-polls] Error:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}
