import { devLog, devWarn } from "@/app/lib/devLog";
// api/stream-summary/route.js
// AISummary için streaming endpoint.
// Cache HIT  → application/json döner (hızlı, bekleme yok)
// Cache MISS → text/plain chunked stream döner (Groq SSE → client)
// Client akümüle eder, stream bitince JSON parse eder.

import { getTierConfig } from "@/app/lib/categoryConfig";
import { streamCompletion } from "@/app/lib/groq";
import { buildNewsPrompt } from "@/app/lib/newsPrompt";
import { getCachedSummary, setCachedSummary } from "@/app/lib/summaryCache";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

export const runtime = "nodejs";

const LANGUAGE_NAMES = {
  tr: "Turkish",
  turkish: "Turkish",
  en: "English",
  english: "English",
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { article, forceLanguage, fast = false, forceRefresh = false } = body;

    if (!article?.title || !article?.sourceUrl) {
      return NextResponse.json(
        { error: "title ve sourceUrl gerekli" },
        { status: 400 },
      );
    }

    const articleId = article.articleId;

    // ── Cache kontrolü ──────────────────────────────────────────────────
    if (articleId && !forceRefresh) {
      const cached = await getCachedSummary(articleId).catch(() => null);
      if (cached) {
        redis.incr("stats:hits:stream-summary").catch(() => {});
        return NextResponse.json({ ...cached, fromCache: true });
      }
    }
    redis.incr("stats:miss:stream-summary").catch(() => {});

    // ── Cache miss → stream ─────────────────────────────────────────────
    const lang = forceLanguage || article.language || "turkish";
    const langName = LANGUAGE_NAMES[(lang || "").toLowerCase()] || "Turkish";
    const tierConfig = getTierConfig(article);
    const { systemPrompt, userPrompt } = buildNewsPrompt(article, langName);

    const modelTier = fast ? "FAST" : "FAST"; // summarize always FAST
    const maxTokens = tierConfig.maxTokensSummary;

    // Akümülatör — stream bitince cache edelim
    let accumulated = "";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamCompletion(userPrompt, {
            model: modelTier,
            temperature: 0.35,
            maxTokens,
            systemPrompt,
          })) {
            accumulated += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          console.error("[stream-summary] Stream error:", err.message);
        } finally {
          controller.close();
          // Stream bitti → cache'e yaz (arka planda)
          if (articleId && accumulated) {
            const cleaned = accumulated
              .replace(/^```(?:json)?\s*/m, "")
              .replace(/\s*```$/m, "")
              .trim();
            try {
              const parsed = JSON.parse(cleaned);
              await setCachedSummary(articleId, {
                ...parsed,
                generatedAt: new Date().toISOString(),
              });
            } catch {
              // JSON parse başarısız — sadece log
              devWarn("[stream-summary] Cache yazılamadı: parse hatası");
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Accel-Buffering": "no", // nginx proxy buffering'i kapat
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[POST /api/stream-summary] Error:", error);
    return NextResponse.json({ error: "Akış başlatılamadı." }, { status: 500 });
  }
}
