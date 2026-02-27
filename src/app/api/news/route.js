import { NextResponse } from "next/server";
import { getLatest } from "@/app/lib/news";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || null;
  const language = searchParams.get("language") || "tr";

  try {
    const data = await getLatest(language, page);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
