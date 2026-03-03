// api/push/subscribe/route.js
// POST → abonelik kaydet, DELETE → abonelik sil

import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

// Her aboneliği endpoint URL'inden türetilen kısa bir anahtarla sakla
function subKey(endpoint) {
  // Son 40 karakteri anahtar olarak kullan (endpoint benzersizdir)
  return `push:sub:${endpoint.slice(-40).replace(/[^a-zA-Z0-9]/g, "_")}`;
}

export async function POST(request) {
  try {
    const sub = await request.json();
    if (!sub?.endpoint) {
      return NextResponse.json({ error: "Geçersiz abonelik" }, { status: 400 });
    }

    const key = subKey(sub.endpoint);
    // TTL yok — abonelik geçerliliğini push hataları ile yönetiyoruz
    await redis.set(key, JSON.stringify(sub));
    await redis.sadd("push:endpoints", key); // index seti

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[push/subscribe] POST hata:", e.message);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    const key = subKey(endpoint);
    await redis.del(key);
    await redis.srem("push:endpoints", key);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[push/subscribe] DELETE hata:", e.message);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
