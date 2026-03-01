import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "haberai_admin";
const MAX_AGE = 60 * 60 * 8; // 8 saat

function makeToken(email) {
  const secret = process.env.CRON_SECRET || "dev-secret";
  return Buffer.from(`${email}:${Date.now()}:${secret}`).toString("base64url");
}

export function verifyAdminToken(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const [email, ts, secret] = decoded.split(":");
    if (email !== process.env.ADMIN_EMAIL) return false;
    if (secret !== (process.env.CRON_SECRET || "dev-secret")) return false;
    if (Date.now() - parseInt(ts) > MAX_AGE * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

// POST /api/admin/auth — giriş
export async function POST(request) {
  const { email, password } = await request.json().catch(() => ({}));

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword)
    return NextResponse.json(
      { error: "Sunucu yapılandırma hatası" },
      { status: 500 },
    );

  if (email !== adminEmail || password !== adminPassword)
    return NextResponse.json(
      { error: "Email veya şifre hatalı" },
      { status: 401 },
    );

  const token = makeToken(email);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/auth — çıkış
export async function DELETE() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
