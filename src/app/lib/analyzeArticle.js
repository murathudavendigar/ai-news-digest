import { devLog } from "@/app/lib/devLog";
import { Redis } from "@upstash/redis";
import { AI_TASK_TIERS } from "./aiContract";
import { buildContextPrompt } from "./contextPrompt";
import { generateCompletion, GROQ_MODELS, tryParseJSON } from "./groq";
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

function resolveModelTier(article) {
  const text = [article.title, article.description].filter(Boolean).join(" ");
  const words = text.trim().split(/\s+/).length;
  return words < 150 ? "FAST" : "BALANCED";
}

function safeParseJSON(raw, label) {
  const parsed = tryParseJSON(raw, label);
  if (parsed) return parsed;
  if (raw) {
    console.error(
      `[analyzeArticle] JSON parse error (${label}):`,
      String(raw).slice(0, 300),
    );
  }
  return null;
}

export async function analyzeArticle(article, forceRefresh = false) {
  const articleId = article.article_id;
  const cacheKey = `analyze:${articleId}`;

  if (!forceRefresh) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        devLog(`[analyzeArticle] Cache HIT for ${articleId}`);
        return { ...cached, fromCache: true };
      }
    } catch {}
  }

  const langName = resolveLanguage(article.language);
  const modelTier = resolveModelTier(article);
  const scoreTier = AI_TASK_TIERS.score;
  const analyzeTier = AI_TASK_TIERS.analyze;

  const scorePrompt = buildScorePrompt(article, langName);
  const contextPrompt = buildContextPrompt(article, langName);

  const scoreResult = await generateCompletion(scorePrompt.userPrompt, {
    model: GROQ_MODELS[scoreTier] || GROQ_MODELS.FAST,
    temperature: 0.1,
    maxTokens: 1200,
    systemPrompt: scorePrompt.systemPrompt,
  });

  const contextResult = await generateCompletion(contextPrompt.userPrompt, {
    model: GROQ_MODELS[modelTier] || GROQ_MODELS[analyzeTier] || GROQ_MODELS.BALANCED,
    temperature: 0.35,
    maxTokens: modelTier === "FAST" ? 2500 : 4000,
    systemPrompt: contextPrompt.systemPrompt,
  });

  const score = safeParseJSON(scoreResult.text, "score");
  const context = safeParseJSON(contextResult.text, "context");

  if (score?.scores) {
    const {
      reliability = 55,
      neutrality = 60,
      emotionalLanguage = 50,
      sourceReputation = 65,
    } = score.scores;
    const overall = Math.round(
      reliability * 0.35 +
        neutrality * 0.3 +
        (100 - emotionalLanguage) * 0.2 +
        sourceReputation * 0.15,
    );
    score.overallScore = overall;
    score.verdict =
      overall >= 60
        ? "reliable"
        : overall >= 35
          ? "questionable"
          : "unreliable";
  }

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
    aiProvider: contextResult.provider || scoreResult.provider,
    aiModel: contextResult.model || scoreResult.model,
    generatedAt: new Date().toISOString(),
    fromCache: false,
  };

  try {
    await redis.set(cacheKey, result, { ex: CACHE_TTL });
  } catch {}

  return result;
}
