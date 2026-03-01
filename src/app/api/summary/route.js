import { generateDailySummary, getDailySummary } from "@/app/lib/dailySummary";
import { NextResponse } from "next/server";

export async function GET() {
  let data = await getDailySummary();
  if (!data) data = await generateDailySummary();
  if (!data || data.error)
    return NextResponse.json(
      { error: data?.error || "failed" },
      { status: 500 },
    );
  return NextResponse.json(data);
}
