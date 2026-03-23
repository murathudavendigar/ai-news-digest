import { NextResponse } from "next/server";
import { generateColumn } from "@/app/lib/generateColumn";

export const maxDuration = 60;

export async function GET(request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (
      !secret ||
      request.headers.get("authorization") !== `Bearer ${secret}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await generateColumn();

    if (result.error) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[cron/generate-column] Error:", err);
    return NextResponse.json(
      { error: "Generation failed", details: err.message },
      { status: 500 },
    );
  }
}
