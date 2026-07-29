import { warmCriticalFeeds } from "@/app/lib/newsSource";
import { NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

/**
 * Vercel Cron (Hobby: günde 1) — kritik RSS feed'lerini ısıt.
 * all + politics/world/business/sports/technology/health
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await warmCriticalFeeds({ budgetMs: 52_000 });
    console.log("[warm-feeds]", JSON.stringify(result));
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[warm-feeds]", err.message);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}
