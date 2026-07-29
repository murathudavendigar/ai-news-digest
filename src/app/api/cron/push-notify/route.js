// api/cron/push-notify/route.js
// Vercel Cron: her gün 17:00 UTC = 20:00 İstanbul

export const maxDuration = 30;

import { getDailySummary } from "@/app/lib/dailySummary";
import { NextResponse } from "next/server";
import { sendPushNotification } from "@/app/lib/push";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getDailySummary();
  if (!summary) {
    return NextResponse.json({ skipped: true, reason: "no-summary" });
  }

  const tops = (summary.mustRead ?? []).slice(0, 3).map((h) => h.title);
  const body =
    tops.length > 0
      ? tops.map((t, i) => `${i + 1}. ${t}`).join(" · ")
      : summary.headline || summary.subheadline || "Bugünün baskısı hazır.";

  // Tek stringify — sendPushNotification objeyi kendisi serileştirir
  const payload = {
    title: `HaberAI · Günün özeti${summary.issueNumber ? ` #${summary.issueNumber}` : ""}`,
    body: body.slice(0, 180),
    url: "/digest",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "haberai-daily",
  };

  const { sent, failed, expired } = await sendPushNotification(payload);

  console.log(
    `[push-notify] Gönderildi: ${sent}, Başarısız: ${failed}, Temizlendi: ${expired}`,
  );
  return NextResponse.json({ sent, failed, expired });
}
