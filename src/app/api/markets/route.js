import { fetchMarketData } from "@/app/lib/realTimeData";
import { NextResponse } from "next/server";

// GET /api/markets
// Redis cache: 1 saat — sayfaları SSR cache'i üstüne eklenir
export async function GET() {
  const data = await fetchMarketData();

  if (!data) {
    return NextResponse.json({ error: "veri_alinamadi" }, { status: 502 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
