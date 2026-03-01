import { devLog, devWarn } from "@/app/lib/devLog";
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

// Makale kısasa 8B yeterli; uzun makalelerde 70B kullan
function resolveModelTier(article) {
  const text = [article.title, article.description].filter(Boolean).join(" ");
  const words = text.trim().split(/\s+/).length;
  return words < 150 ? "FAST" : "BALANCED";
}

// Kesilmiş (truncated) JSON'u onarır: açık string/array/objeleri kapatır
function repairTruncatedJSON(str) {
  let s = str.trimEnd();
  // Sondaki virgülü temizle
  if (s.endsWith(",")) s = s.slice(0, -1);

  let curly = 0,
    square = 0,
    inStr = false,
    escapeNext = false;
  for (const ch of s) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === "\\" && inStr) {
      escapeNext = true;
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

  if (inStr) s += '"'; // açık string'i kapat
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

function safeParseJSON(raw, label) {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Yanıt kesilmiş olabilir — onarıp tekrar dene
    try {
      const repaired = repairTruncatedJSON(cleaned);
      const result = JSON.parse(repaired);
      devWarn(`[analyzeArticle] JSON truncation repaired (${label})`);
      return result;
    } catch {
      console.error(
        `[analyzeArticle] JSON parse error (${label}):`,
        cleaned.slice(0, 300),
      );
      return null;
    }
  }
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
  const modelTier = resolveModelTier(article); // adaptive: kısa haberde 8B yeterli

  // Score uses FAST (8B) always — structured JSON scoring doesn't need 70B.
  // Context uses adaptive tier — BALANCED for long articles, FAST for short.
  const scorePrompt = buildScorePrompt(article, langName);
  const contextPrompt = buildContextPrompt(article, langName);

  const scoreResult = await generateCompletion(scorePrompt.userPrompt, {
    model: GROQ_MODELS.FAST,
    temperature: 0.2,
    maxTokens: 1800, // score JSON: redFlags + greenFlags + tactics + missingContext arrays in Turkish
    systemPrompt: scorePrompt.systemPrompt,
  });

  const contextResult = await generateCompletion(contextPrompt.userPrompt, {
    model: GROQ_MODELS[modelTier],
    temperature: 0.3,
    maxTokens: modelTier === "FAST" ? 2500 : 4000, // context: timeline+actors+scenarios+terminology in Turkish
    systemPrompt: contextPrompt.systemPrompt,
  });

  const score = safeParseJSON(scoreResult.text, "score");
  const context = safeParseJSON(contextResult.text, "context");

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
    aiProvider: contextResult.provider,
    aiModel: contextResult.model,
    generatedAt: new Date().toISOString(),
    fromCache: false,
  };

  try {
    await redis.set(cacheKey, result, { ex: CACHE_TTL });
  } catch {}

  return result;
}
