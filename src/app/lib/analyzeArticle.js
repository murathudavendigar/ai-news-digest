import { Redis } from "@upstash/redis";
import { buildContextPrompt } from "./contextPrompt";
import { generateCompletion, GROQ_MODELS } from "./groq";
import { buildScorePrompt } from "./scorePrompt";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days

const LANGUAGE_NAMES = {
  tr: "Turkish",
  turkish: "Turkish",
  en: "English",
  english: "English",
  de: "German",
  german: "German",
  fr: "French",
  french: "French",
  ar: "Arabic",
  arabic: "Arabic",
};

function resolveLanguage(lang) {
  const raw = (lang || "turkish").toLowerCase();
  return LANGUAGE_NAMES[raw] || "Turkish";
}

function safeParseJSON(raw, label) {
  const cleaned = raw
    .replace(/^```(?:json)?/m, "")
    .replace(/```$/m, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error(
      `[analyzeArticle] JSON parse error (${label}):`,
      cleaned.slice(0, 200),
    );
    return null;
  }
}

export async function analyzeArticle(article, forceRefresh = false) {
  const articleId = article.article_id;
  const cacheKey = `analyze:${articleId}`;

  if (!forceRefresh) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[analyzeArticle] Cache HIT for ${articleId}`);
        return { ...cached, fromCache: true };
      }
    } catch {}
  }

  const langName = resolveLanguage(article.language);

  // We can run score and context generation in parallel since they are independent
  const [scoreRaw, contextRaw] = await Promise.all([
    generateCompletion(buildScorePrompt(article, langName).userPrompt, {
      model: GROQ_MODELS.BALANCED,
      temperature: 0.2,
      maxTokens: 1024,
      systemPrompt: buildScorePrompt(article, langName).systemPrompt,
    }),
    generateCompletion(buildContextPrompt(article, langName).userPrompt, {
      model: GROQ_MODELS.SMART, 
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt: buildContextPrompt(article, langName).systemPrompt,
    }),
  ]);

  const score = safeParseJSON(scoreRaw, "score");
  const context = safeParseJSON(contextRaw, "context");

  if (!score && !context) {
    return {
      error: "parse_error",
      message: "Analiz oluşturulamadı.",
      fromCache: false,
    };
  }

  const result = {
    score,
    context,
    generatedAt: new Date().toISOString(),
    fromCache: false,
  };

  try {
    await redis.set(cacheKey, result, { ex: CACHE_TTL });
  } catch {}

  return result;
}
