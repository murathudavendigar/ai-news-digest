import { NextResponse } from "next/server";
import { generateDailyDigest } from "@/app/lib/generateDailyDigest";

export const maxDuration = 60; // Max execution time for Vercel Hobby

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateDailyDigest();
  
  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
}
