import { verifyAdminToken } from "@/app/api/admin/auth/route";
import { NextResponse } from "next/server";

/**
 * Admin paneli cron tetikleyici — CRON_SECRET istemciye sızmaz.
 * Cookie ile admin oturumu gerekir; sunucu Bearer CRON_SECRET ile cron'u çağırır.
 *
 * POST { job: "push-notify" | "daily-digest" | ... }
 */
const ALLOWED = new Set([
  "push-notify",
  "daily-digest",
  "daily-summary",
  "generate-column",
  "breaking-news",
  "refresh-international",
  "rss-health",
]);

export async function POST(request) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET yapılandırılmamış" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const job = String(body.job || "").replace(/^\//, "");
  if (!ALLOWED.has(job)) {
    return NextResponse.json({ error: "Geçersiz job" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/api/cron/${job}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(
    { ok: res.ok, status: res.status, data },
    { status: res.ok ? 200 : res.status },
  );
}
