import { fetchWeatherData } from "@/app/lib/realTimeData";
import { NextResponse } from "next/server";

// GET /api/weather?city=Istanbul
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || "Istanbul";

  const data = await fetchWeatherData(city);

  if (!data) {
    return NextResponse.json({ error: "veri_alinamadi" }, { status: 502 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
