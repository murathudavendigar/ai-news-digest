// POST — called by Vercel cron every 30 minutes
// Forces a fresh fetch and translation of international news

import { fetchInternationalNews } from "@/app/lib/fetchInternationalNews";

export async function POST(request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const articles = await fetchInternationalNews({ forceRefresh: true });
    return Response.json({ success: true, count: articles.length });
  } catch (err) {
    console.error("[cron/refresh-international]", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
