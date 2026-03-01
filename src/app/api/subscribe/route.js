// api/subscribe/route.js
// Günlük özet e-posta aboneliği — e-posta adresleri Redis'e kaydedilir.
// Mail gönderimi şimdilik devre dışı, ilerleyen aşamada eklenecek.

import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const SUBSCRIBERS_KEY = "digest:subscribers";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Geçerli bir e-posta adresi girin." },
        { status: 400 },
      );
    }

    const normalized = email.trim().toLowerCase();

    // Daha önce kayıtlı mı?
    const alreadyMember = await redis
      .sismember(SUBSCRIBERS_KEY, normalized)
      .catch(() => false);
    if (alreadyMember) {
      return NextResponse.json({ message: "already_subscribed" });
    }

    // Redis set'e ekle
    await redis.sadd(SUBSCRIBERS_KEY, normalized);
    const today = new Date().toISOString().slice(0, 10);
    await Promise.all([
      redis.incr("stats:subscribers:total").catch(() => {}),
      redis.incr(`stats:subscribers:today:${today}`).catch(() => {}),
    ]);

    console.log(`[subscribe] Yeni abone: ${normalized}`);
    return NextResponse.json({ message: "subscribed" });
  } catch (error) {
    console.error("[POST /api/subscribe] Error:", error);
    return NextResponse.json(
      { error: "Kayıt sırasında hata oluştu." },
      { status: 500 },
    );
  }
}

// Admin: abone sayısı
export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const count = await redis.scard(SUBSCRIBERS_KEY).catch(() => 0);
  return NextResponse.json({ count });
}
