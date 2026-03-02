// api/stream-analyze/route.js
// ArticleAnalysis için Server-Sent Events tabanlı analiz endpoint'i.
//
// Cache HIT  → application/json döner (anlık)
// Cache MISS → text/event-stream ile aşamalı gönderim:
//   • "score" eventi  — güvenilirlik skoru (hızlı, 8B model)
//   • "context" eventi — bağlam zinciri (paralel, score ile eş zamanlı başlar)
//   • "done" eventi   — tüm veri hazır
//
// Bu sayede client, score hazır olunca hemen render eder, context beklemeye devam eder.

import { buildContextPrompt } from "@/app/lib/contextPrompt";
import { devLog } from "@/app/lib/devLog";
import { generateCompletion, GROQ_MODELS } from "@/app/lib/groq";
import { buildScorePrompt } from "@/app/lib/scorePrompt";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const CACHE_TTL = 7 * 24 * 60 * 60; // 7 gün

const LANGUAGE_NAMES = {
  tr: "Turkish",
  turkish: "Turkish",
  en: "English",
  english: "English",
  de: "German",
  german: "German",
  fr: "French",
  french: "French",
};

function resolveLanguage(lang) {
  return LANGUAGE_NAMES[(lang || "").toLowerCase()] || "Turkish";
}

function resolveModelTier(article) {
  const text = [article.title, article.description].filter(Boolean).join(" ");
  const words = text.trim().split(/\s+/).length;
  return words < 150 ? "FAST" : "BALANCED";
}

function repairJSON(str) {
  let s = str
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();
  if (s.endsWith(",")) s = s.slice(0, -1);
  let curly = 0,
    square = 0,
    inStr = false,
    esc = false;
  for (const ch of s) {
    if (esc) {
      esc = false;
      continue;
    }
    if (ch === "\\" && inStr) {
      esc = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === "{") curly++;
    else if (ch === "}") curly--;
    else if (ch === "[") square++;
    else if (ch === "]") square--;
  }
  if (inStr) s += '"';
  while (square > 0) {
    s += "]";
    square--;
  }
  while (curly > 0) {
    s += "}";
    curly--;
  }
  return s;
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    /* fall through */
  }
  try {
    return JSON.parse(repairJSON(raw));
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const { article, forceRefresh = false } = await req.json();

    if (!article?.article_id || !article?.title) {
      return NextResponse.json(
        { error: "article_id ve title gerekli" },
        { status: 400 },
      );
    }

    const cacheKey = `analyze:${article.article_id}`;

    // ── Cache HIT → JSON ────────────────────────────────────────────────
    if (!forceRefresh) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          devLog(`[stream-analyze] Cache HIT for ${article.article_id}`);
          redis.incr("stats:hits:analyze").catch(() => {});
          return NextResponse.json({ ...cached, fromCache: true });
        }
      } catch {
        /* Redis bağlantı hatası — cache miss ile devam */
      }
    }

    redis.incr("stats:miss:analyze").catch(() => {});

    // ── Cache MISS → SSE stream ─────────────────────────────────────────
    const langName = resolveLanguage(article.language);
    const modelTier = resolveModelTier(article);
    const scorePrompt = buildScorePrompt(article, langName);
    const contextPrompt = buildContextPrompt(article, langName);

    const encoder = new TextEncoder();
    let scoreResult = null;
    let contextResult = null;

    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj) => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(obj)}\n\n`),
            );
          } catch {
            /* controller kapatılmış */
          }
        };

        try {
          // Score ve context paralel çalış — her biri hazır olunca event gönder
          await Promise.all([
            generateCompletion(scorePrompt.userPrompt, {
              model: GROQ_MODELS.FAST,
              temperature: 0.2,
              maxTokens: 1800,
              systemPrompt: scorePrompt.systemPrompt,
            }).then((res) => {
              scoreResult = safeParse(res.text);
              if (scoreResult) send({ type: "score", data: scoreResult });
            }),

            generateCompletion(contextPrompt.userPrompt, {
              model: GROQ_MODELS[modelTier],
              temperature: 0.3,
              maxTokens: modelTier === "FAST" ? 2500 : 4000,
              systemPrompt: contextPrompt.systemPrompt,
            }).then((res) => {
              contextResult = safeParse(res.text);
              if (contextResult) send({ type: "context", data: contextResult });
            }),
          ]);

          const fullResult = {
            score: scoreResult,
            context: contextResult,
            generatedAt: new Date().toISOString(),
            fromCache: false,
          };

          send({ type: "done", data: fullResult });

          // Cache'e yaz (fire-and-forget)
          if (scoreResult || contextResult) {
            redis.set(cacheKey, fullResult, { ex: CACHE_TTL }).catch(() => {});
          }
        } catch (err) {
          send({ type: "error", message: err.message || "Analiz başarısız" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Analiz başlatılamadı" },
      { status: 500 },
    );
  }
}
