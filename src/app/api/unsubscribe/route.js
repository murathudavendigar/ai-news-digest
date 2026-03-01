// api/unsubscribe/route.js
// Abonelikten çıkma endpoint'i.
// Token = HMAC-SHA256(email, CRON_SECRET) — stateless, Redis'e ek kayıt gerekmez.
// Welcome e-postasındaki link: /api/unsubscribe?token=<hex>&email=<encoded>

import { siteConfig } from "@/app/lib/siteConfig";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";

export const runtime = "nodejs";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const SUBSCRIBERS_KEY = "digest:subscribers";

function makeToken(email) {
  const secret = process.env.CRON_SECRET || "fallback-secret";
  return createHmac("sha256", secret).update(email.toLowerCase()).digest("hex");
}

const page = (title, body, ok = true) => `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — ${siteConfig.name}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Georgia,serif;background:#fafaf9;color:#1c1917;min-height:100vh;
         display:flex;align-items:center;justify-content:center;padding:24px}
    .card{max-width:480px;width:100%;background:#fff;border:1px solid #e7e5e4;
          border-radius:16px;padding:40px 32px;text-align:center}
    .icon{font-size:2.5rem;margin-bottom:16px}
    h1{font-size:1.25rem;font-weight:900;margin-bottom:10px}
    p{font-size:.875rem;line-height:1.7;color:#78716c}
    a{color:#f59e0b;text-decoration:none;font-weight:700}
    .badge{display:inline-block;margin-top:20px;padding:6px 16px;background:#fef3c7;
           color:#92400e;border-radius:999px;font-size:.75rem;font-weight:700}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${ok ? "✅" : "⚠️"}</div>
    <h1>${title}</h1>
    <p>${body}</p>
    ${ok ? '<span class="badge">İşlem tamamlandı</span>' : ""}
    <p style="margin-top:24px;font-size:.75rem">
      <a href="/">Ana sayfaya dön →</a>
    </p>
  </div>
</body>
</html>`;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") || "").toLowerCase().trim();
  const token = searchParams.get("token") || "";

  if (!email || !token) {
    return new Response(
      page("Geçersiz bağlantı", "E-posta veya token eksik.", false),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const expected = makeToken(email);
  if (token !== expected) {
    return new Response(
      page(
        "Geçersiz token",
        "Bu abonelik çıkış bağlantısı geçersiz veya süresi dolmuş.",
        false,
      ),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const isMember = await redis
    .sismember(SUBSCRIBERS_KEY, email)
    .catch(() => false);

  if (!isMember) {
    return new Response(
      page(
        "Zaten kayıtlı değilsiniz",
        `<strong>${email}</strong> adresimizin abone listesinde bulunamadı.<br/>Belki daha önce çıkmış olabilirsiniz.`,
        false,
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  await redis.srem(SUBSCRIBERS_KEY, email).catch(() => {});
  console.log(`[unsubscribe] Abonelik iptal: ${email}`);

  return new Response(
    page(
      "Aboneliğiniz iptal edildi",
      `<strong>${email}</strong> adresiniz listeden kaldırıldı.<br/>
       Tekrar abone olmak isterseniz özet sayfasına gidin.`,
    ),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

// Admin: belirli bir e-postayı programatik olarak çıkar (admin panel için)
export async function DELETE(req) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { email } = await req.json().catch(() => ({}));
  if (!email)
    return NextResponse.json({ error: "email gerekli" }, { status: 400 });

  await redis.srem(SUBSCRIBERS_KEY, email.toLowerCase().trim());
  return NextResponse.json({ removed: true });
}
