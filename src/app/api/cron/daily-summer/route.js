// app/api/cron/daily-summary/route.js
// Vercel Cron Job — her gün sabah 07:00 TR saatinde tetiklenir (UTC 04:00)
//
// vercel.json'a ekle:
// {
//   "crons": [{ "path": "/api/cron/daily-summary", "schedule": "0 4 * * *" }]
// }

import { NextResponse } from "next/server";
import { generateDailySummary } from "@/app/lib/dailySummary";

export const runtime = "nodejs";
export const maxDuration = 60; // Groq çağrısı için yeterli süre

export async function GET(req) {
  // Vercel cron güvenliği — sadece Vercel'den gelen istekleri kabul et
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[cron] Generating daily summary...");
    const result = await generateDailySummary();

    if (result.error) {
      console.error("[cron] Error:", result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    console.log("[cron] Daily summary generated:", result.headline);
    return NextResponse.json({ success: true, headline: result.headline });
  } catch (err) {
    console.error("[cron] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
