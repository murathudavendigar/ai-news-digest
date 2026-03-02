import { NextResponse } from "next/server";
import { verifyAdminToken } from "../auth/route";

const unauth = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID; // opsiyonel

function buildUrl(path, params = {}) {
  const base = "https://vercel.com/api/v1/web/insights";
  const qs = new URLSearchParams({
    projectId: PROJECT_ID,
    ...(TEAM_ID ? { teamId: TEAM_ID } : {}),
    ...params,
  });
  return `${base}${path}?${qs}`;
}

function vFetch(url) {
  return fetch(url, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    next: { revalidate: 300 }, // 5 dk cache
  });
}

export async function GET(request) {
  if (!verifyAdminToken(request)) return unauth();

  if (!VERCEL_TOKEN || !PROJECT_ID) {
    return NextResponse.json(
      { error: "VERCEL_TOKEN veya VERCEL_PROJECT_ID eksik" },
      { status: 503 },
    );
  }

  const now = Date.now();
  const day7 = now - 7 * 24 * 60 * 60 * 1000;
  const day30 = now - 30 * 24 * 60 * 60 * 1000;

  const timeParams = {
    from: new Date(day7).toISOString(),
    to: new Date(now).toISOString(),
    granularity: "day",
    environment: "production",
  };

  try {
    const [overviewRes, topPagesRes, devicesRes] = await Promise.all([
      vFetch(buildUrl("/stats/overview", timeParams)),
      vFetch(buildUrl("/stats/top-pages", { ...timeParams, limit: 8 })),
      vFetch(buildUrl("/stats/devices", timeParams)),
    ]);

    const [overview, topPages, devices] = await Promise.all([
      overviewRes.ok ? overviewRes.json() : null,
      topPagesRes.ok ? topPagesRes.json() : null,
      devicesRes.ok ? devicesRes.json() : null,
    ]);

    return NextResponse.json({ overview, topPages, devices });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
