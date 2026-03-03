// Summarize + Score + Context → TEK AI çağrısı
// Önceki: ~13.000 token/haber → Şimdi: ~2.500 token/haber (%80 tasarruf)

import { Redis } from "@upstash/redis";
import { generateCompletion, GROQ_MODELS } from "./groq";
import { getTierConfig, TIERS } from "./categoryConfig";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});
const CACHE_TTL = 7 * 24 * 3600;

const LANG = {
  tr: "Turkish",
  turkish: "Turkish",
  en: "English",
  english: "English",
};
const lang = (l) => LANG[(l || "").toLowerCase()] || "Turkish";

function safeJSON(raw) {
  try {
    return JSON.parse(
      raw
        .replace(/^```(?:json)?\s*/m, "")
        .replace(/```\s*$/m, "")
        .trim(),
    );
  } catch {
    return null;
  }
}

// ── Tek prompt, 3 analizi birden üretir ──────────────────────────────────
function buildUnifiedPrompt(article, tier, langName) {
  const isDeep = tier === TIERS.DEEP;
  const isStd = tier === TIERS.STANDARD;

  // RSS tam içerik varsa kullan — AI analizi çok daha iyi olur
  const articleText = [
    article.title,
    article.content || article.description, // tam içerik önce
    article.source_name ? `Source: ${article.source_name}` : null,
    article.category?.[0] ? `Category: ${article.category[0]}` : null,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 4000); // token limitini aşma

  const system = `You are an expert news analyst. Respond ONLY with valid JSON, no markdown fences, no extra text.`;

  const scoreFields = isDeep
    ? `
    "score": {
      "overallScore": <0-100>,
      "verdict": "reliable|questionable|unreliable",
      "summary": "2 sentences",
      "scores": { "reliability":<0-100>, "neutrality":<0-100>, "emotionalLanguage":<0-100>, "sourceReputation":<0-100> },
      "redFlags": ["max 2 short strings"],
      "greenFlags": ["max 2 short strings"],
      "clickbaitScore": <0-100>,
      "manipulationTactics": [],
      "missingContext": ["1 item max"],
      "factCheckSuggestions": ["1 item max"]
    },`
    : isStd
      ? `
    "score": {
      "overallScore": <0-100>,
      "verdict": "reliable|questionable|unreliable",
      "summary": "1 sentence",
      "scores": { "reliability":<0-100>, "neutrality":<0-100>, "emotionalLanguage":<0-100>, "sourceReputation":<0-100> },
      "redFlags": [],
      "greenFlags": [],
      "clickbaitScore": <0-100>,
      "manipulationTactics": [],
      "missingContext": [],
      "factCheckSuggestions": []
    },`
      : '"score": null,';

  const contextFields = isDeep
    ? `
    "context": {
      "oneLiner": "1 sentence why this matters now",
      "whyNow": "1-2 sentences",
      "timeline": [{"period":"short label","event":"brief","relevance":"1 line"}],
      "rootCause": "1-2 sentences",
      "keyActors": [{"name":"","role":"","interest":"1 line","powerLevel":"dominant|significant|peripheral"}],
      "scenarios": [{"label":"","probability":"high|medium|low","description":"1 sentence","indicator":"1 line"}],
      "biggerPicture": "1-2 sentences",
      "terminology": [],
      "relatedStories": []
    },`
    : isStd
      ? `
    "context": {
      "oneLiner": "1 sentence",
      "whyNow": "1 sentence",
      "timeline": [],
      "rootCause": "1 sentence",
      "keyActors": [],
      "scenarios": [],
      "biggerPicture": "1 sentence",
      "terminology": [],
      "relatedStories": []
    },`
      : '"context": null,';

  const user = `Analyze this news article in ${langName}.

${articleText}

Respond with exactly this JSON structure:
{
  "summary": {
    "analysis": "3-4 sentences of insight beyond the headline",
    "keyPoints": ["point 1", "point 2", "point 3"],
    "sentiment": "positive|negative|neutral",
    "confidence": "high|medium|low",
    "readingTimeMinutes": <1-5>
  },
  ${scoreFields}
  ${contextFields}
  "tier": "${tier}"
}`;

  return { system, user };
}

// ── Ana export ───────────────────────────────────────────────────────────
export async function getUnifiedAnalysis(article, forceRefresh = false) {
  const tierConfig = getTierConfig(article);

  // MINIMAL → sadece hızlı özet, score/context yok
  if (tierConfig.tier === TIERS.MINIMAL) {
    return await getMinimalSummary(article, tierConfig);
  }

  const cacheKey = `unified:${article.article_id}`;

  if (!forceRefresh) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        await redis.incr("stats:hits:summarize").catch(() => {});
        return { ...cached, fromCache: true };
      }
    } catch {}
  }

  await redis.incr("stats:miss:summarize").catch(() => {});

  const langName = lang(article.language);
  const { system, user } = buildUnifiedPrompt(
    article,
    tierConfig.tier,
    langName,
  );

  // Token bütçesi: DEEP=1400, STANDARD=900
  const maxTokens = tierConfig.tier === TIERS.DEEP ? 1400 : 900;

  const raw = await generateCompletion(user, {
    model: GROQ_MODELS.BALANCED,
    temperature: 0.25,
    maxTokens,
    systemPrompt: system,
  });

  const parsed = safeJSON(raw);
  if (!parsed) throw new Error("JSON parse başarısız");

  const result = {
    // Summarize alanları
    analysis: parsed.summary?.analysis || "",
    keyPoints: parsed.summary?.keyPoints || [],
    sentiment: parsed.summary?.sentiment || "neutral",
    confidence: parsed.summary?.confidence || "medium",
    readingTimeMinutes: parsed.summary?.readingTimeMinutes || 2,
    resolvedLanguage: langName,
    generatedAt: new Date().toISOString(),
    // Score + Context
    score: parsed.score || null,
    context: parsed.context || null,
    tier: tierConfig.tier,
    fromCache: false,
  };

  try {
    await redis.set(cacheKey, result, { ex: CACHE_TTL });
  } catch {}

  return result;
}

// MINIMAL tier — sadece kısa özet, 400 token
async function getMinimalSummary(article, tierConfig) {
  const cacheKey = `minimal:${article.article_id}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return { ...cached, fromCache: true };
  } catch {}

  const langName = lang(article.language);
  const raw = await generateCompletion(
    `Summarize this news in ${langName} in 2-3 sentences. Return JSON only: {"analysis":"...","keyPoints":[],"sentiment":"positive|negative|neutral","confidence":"medium","readingTimeMinutes":1}\n\n${article.title}\n${article.description || ""}`,
    { model: GROQ_MODELS.FAST, temperature: 0.2, maxTokens: 300 },
  );

  const parsed = safeJSON(raw);
  const result = {
    analysis: parsed?.analysis || article.description || "",
    keyPoints: [],
    sentiment: parsed?.sentiment || "neutral",
    confidence: "medium",
    readingTimeMinutes: 1,
    resolvedLanguage: langName,
    generatedAt: new Date().toISOString(),
    score: null,
    context: null,
    tier: TIERS.MINIMAL,
    fromCache: false,
  };

  try {
    await redis.set(cacheKey, result, { ex: CACHE_TTL });
  } catch {}
  return result;
}
