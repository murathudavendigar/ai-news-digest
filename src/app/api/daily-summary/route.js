import { getDailySummary } from "@/app/lib/dailySummary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Bu route SADECE cache'i okur.
// Üretim yalnızca /api/cron/daily-summary (Vercel Cron) tarafından tetiklenir.
// Gece 12'den sonra ilk ziyarette otomatik üretim devreye girecek olmasını önluyoruz.
export async function GET() {
  try {
    const summary = await getDailySummary();

    if (!summary) {
      // Henüz cron çalışmadı — istemciye "henüz hazır değil" sinyali gönder
      return NextResponse.json(
        {
          pending: true,
          message:
            "Günlük özet henüz hazırlanmadı. Sabah 07:00'de güncellenecek.",
        },
        { status: 202 },
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
