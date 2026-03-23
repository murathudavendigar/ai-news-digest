// api/cron/push-notify/route.js
// Vercel Cron: her gün 17:00 UTC = 20:00 İstanbul

export const maxDuration = 30;

import { getDailySummary } from "@/app/lib/dailySummary";
import { NextResponse } from "next/server";
import { sendPushNotification } from "@/app/lib/push";

export async function GET(request) {
  // Auth
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Günlük özetin cache'de olup olmadığını kontrol et
  const summary = await getDailySummary();
  if (!summary) {
    return NextResponse.json({ skipped: true, reason: "no-summary" });
  }

  // Bildirim içeriğini hazırla
  // mustRead varsa ilk 3'ü al, yoksa sections'tan al
  const headlines = (summary.mustRead ?? [])
    .slice(0, 3)
    .map((h, i) => `${i + 1}. ${h.title}`)
    .join("\n");

  const payload = JSON.stringify({
    title: `📰 HaberAI — Günün Özeti #${summary.issueNumber ?? ""}`,
    body: headlines || summary.headline || "Bugünün haberleri hazır!",
    url: "/summary",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });

  const { sent, failed, expired } = await sendPushNotification(payload);

  console.log(
    `[push-notify] Gönderildi: ${sent}, Başarısız: ${failed}, Temizlendi: ${expired}`,
  );
  return NextResponse.json({ sent, failed, expired });
}
