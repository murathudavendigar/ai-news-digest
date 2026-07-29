import { withAiContract } from "@/app/lib/aiContract";
import { redis } from "@/app/lib/redis";
import {
  generateWithGrounding,
  GEMINI_MODELS,
  parseGeminiJSON,
} from "@/app/lib/gemini";
import { checkRateLimit, clientIp } from "@/app/lib/rateLimit";

export const runtime = "nodejs";

const EMPTY_ANALYSIS = {
  whatIsIt: null,
  whyMatters: [],
  timeline: [],
  keyPlayers: [],
  whatNext: [],
};

export async function GET(request, { params }) {
  const rl = await checkRateLimit(`analysis:${clientIp(request)}`, {
    limit: 12,
    windowSec: 60,
  });
  if (!rl.ok) {
    return Response.json(
      { error: "Çok fazla istek", message: "Biraz sonra tekrar dene." },
      { status: 429 },
    );
  }

  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  const url = searchParams.get("url");

  if (!title) {
    return Response.json({ error: "title required" }, { status: 400 });
  }

  const cacheKey = `analysis:${slug}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = typeof cached === "string" ? JSON.parse(cached) : cached;
      return Response.json({ ...EMPTY_ANALYSIS, ...data, cached: true });
    }

    const prompt = withAiContract(`
"${title}" haberini analiz et.${url ? ` Kaynak: ${url}` : ""}

Türkçe olarak şu yapıda kapsamlı bir arka plan analizi yaz.
Bilmediğin bilgi uydurma; emin değilsen genel bağlam ver veya null bırak.

Yanıt YALNIZCA JSON:
{
  "whatIsIt": "2-3 cümle bağlam veya null",
  "whyMatters": ["madde 1", "madde 2", "madde 3"],
  "timeline": [
    { "date": "Mart 2026", "event": "Ne oldu" }
  ],
  "keyPlayers": [
    { "name": "İsim", "role": "Rolü" }
  ],
  "whatNext": ["senaryo 1", "senaryo 2"],
  "generatedAt": "${new Date().toISOString()}"
}
`);

    const raw = await generateWithGrounding(prompt, {
      model: GEMINI_MODELS.PRIMARY_ANALYSIS,
      temperature: 0.3,
      maxTokens: 2000,
    });

    let analysis;
    try {
      analysis = parseGeminiJSON(raw, "deep-analysis");
    } catch {
      const jsonMatch = raw?.match?.(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      analysis = JSON.parse(jsonMatch[0]);
    }

    const normalized = {
      whatIsIt: analysis.whatIsIt || null,
      whyMatters: Array.isArray(analysis.whyMatters) ? analysis.whyMatters : [],
      timeline: Array.isArray(analysis.timeline) ? analysis.timeline : [],
      keyPlayers: Array.isArray(analysis.keyPlayers) ? analysis.keyPlayers : [],
      whatNext: Array.isArray(analysis.whatNext) ? analysis.whatNext : [],
      generatedAt: analysis.generatedAt || new Date().toISOString(),
    };

    if (
      !normalized.whatIsIt &&
      !normalized.whyMatters.length &&
      !normalized.timeline.length
    ) {
      throw new Error("Empty analysis payload");
    }

    await redis.set(cacheKey, normalized, { ex: 21600 });

    return Response.json({ ...normalized, cached: false });
  } catch (err) {
    console.error("[analysis]", slug, err.message);
    return Response.json(
      {
        error: "Analiz üretilemedi",
        message:
          "Arka plan analizi şu an hazırlanamadı. Biraz sonra tekrar dene.",
        details: err.message,
      },
      { status: 502 },
    );
  }
}
