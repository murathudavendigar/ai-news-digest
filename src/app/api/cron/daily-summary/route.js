import { generateDailySummary, getDailySummary } from "@/app/lib/dailySummary";
import { devLog, devWarn } from "@/app/lib/devLog";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Vercel Hobby plan max 60s — AI grounding + 4 paralel çağrı için gerekli
export const maxDuration = 60;

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

async function writeLog(entry) {
  try {
    await redis.lpush("cron:log", JSON.stringify({ ...entry, _v: 1 }));
    await redis.ltrim("cron:log", 0, 29);
    if (entry.status === "success")
      await redis.set("cron:lastSuccess", entry.triggeredAt);
  } catch (e) {
    console.error("[cron] Log hatası:", e.message);
  }
}

async function safeIncr(key) {
  try {
    await redis.incr(key);
  } catch {}
}

// Standalone function — HTTP handler ve admin route tarafından direkt çağrılır.
export async function runDailySummaryCron(triggeredBy = "vercel-cron") {
  const triggeredAt = new Date().toISOString();
  const t0 = Date.now();
  devLog(`[cron] ▶ ${triggeredBy} — ${triggeredAt}`);

  /* ── 0. Günlük stats sıfırlama ── */
  try {
    const todayKeys = [
      "stats:api:calls:today",
      "stats:cache:hits:today",
      "stats:cache:misses:today",
      ...["groq", "sambanova", "cerebras", "openrouter"].map(
        (k) => `stats:ai:${k}:calls:today`,
      ),
    ];
    await Promise.all(todayKeys.map((k) => redis.del(k).catch(() => {})));
    devLog("[cron] ♻ Günlük stats sıfırlandı");
  } catch (e) {
    devWarn("[cron] Stats sıfırlama hatası (devam):", e.message);
  }

  /* ── 1. Cache kontrolü (sadece otomatik cron için) ── */
  if (triggeredBy === "vercel-cron") {
    try {
      const existing = await getDailySummary();
      if (existing) {
        const entry = {
          triggeredAt,
          triggeredBy,
          status: "skipped",
          reason: "already-cached",
          durationMs: Date.now() - t0,
          issueNumber: existing.issueNumber,
        };
        await writeLog(entry);
        devLog("[cron] ⏭ Cache zaten var, atlandı");
        return { success: true, skipped: true };
      }
    } catch (e) {
      devWarn("[cron] Cache kontrol hatası (devam):", e.message);
    }
  }

  /* ── 2. Üretim ── */
  let result;
  try {
    result = await generateDailySummary();
  } catch (e) {
    console.error("[cron] ✕ generateDailySummary fırlattı:", e.message);
    await safeIncr("stats:errors:gemini");
    await writeLog({
      triggeredAt,
      triggeredBy,
      status: "error",
      error: e.message,
      step: "generate",
      durationMs: Date.now() - t0,
    });
    return { success: false, error: e.message };
  }

  /* ── 3. Sonuç doğrulama ── */
  if (!result || result.error) {
    const msg = result?.error || "null result";
    console.error("[cron] ✕ Üretim başarısız:", msg);
    await writeLog({
      triggeredAt,
      triggeredBy,
      status: "error",
      error: msg,
      step: "validation",
      durationMs: Date.now() - t0,
    });
    return { success: false, error: msg };
  }

  /* ── 4. Stats ── */
  await Promise.all([
    safeIncr("stats:api:calls:today"),
    safeIncr("stats:api:calls:total"),
  ]);

  /* ── 5. Başarı logu ── */
  const durationMs = Date.now() - t0;
  await writeLog({
    triggeredAt,
    triggeredBy,
    status: "success",
    durationMs,
    issueNumber: result.issueNumber,
    generatedAt: result.generatedAt,
    articleCount: result.articleCount,
    dayMood: result.dayMood,
  });

  devLog(`[cron] ✓ Sayı #${result.issueNumber} — ${durationMs}ms`);
  return {
    success: true,
    issueNumber: result.issueNumber,
    generatedAt: result.generatedAt,
    durationMs,
  };
}

export async function GET(request) {
  /* ── Auth ── */
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const triggeredBy = request.headers.get("x-triggered-by") || "vercel-cron";
  const result = await runDailySummaryCron(triggeredBy);
  return NextResponse.json(result, {
    status: result.success || result.skipped ? 200 : 500,
  });
}
