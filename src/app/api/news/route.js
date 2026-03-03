// import { NextResponse } from "next/server";
// import { getLatest } from "@/app/lib/news";

// export async function GET(req) {
//   const { searchParams } = new URL(req.url);
//   const page = searchParams.get("page") || null;
//   const language = searchParams.get("language") || "tr";

//   try {
//     const data = await getLatest(language, page);
//     return NextResponse.json(data);
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

// app/api/news/route.js — RSS önce, NewsData fallback
import { getNewsFeed } from "@/app/lib/newsSource";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || null;
  const page = parseInt(searchParams.get("page") || "1");

  try {
    const data = await getNewsFeed({ category, page });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[news API]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
