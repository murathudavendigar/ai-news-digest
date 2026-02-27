import { generateDailySummary, getDailySummary } from "@/app/lib/dailySummary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    let summary = await getDailySummary();

    if (!summary) {
      summary = await generateDailySummary();
    }

    if (summary?.error) {
      return NextResponse.json(
        { error: "Özet oluşturulamadı." },
        { status: 500 },
      );
    }

    return NextResponse.json(summary, {
      headers: { "x-cache": summary.fromCache ? "HIT" : "MISS" },
    });
  } catch (err) {
    console.error("[daily-summary] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
