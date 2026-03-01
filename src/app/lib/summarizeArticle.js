
import { generateCompletion, GROQ_MODELS } from "./groq";
import { buildNewsPrompt } from "./newsPrompt";
import { getTierConfig } from "./categoryConfig";

export async function summarizeArticle(article, options = {}) {
  const tierConfig = getTierConfig(article);
  const lang = article.language || "turkish";

  // Dil adını çöz
  const LANGUAGE_NAMES = {
    tr: "Turkish",
    turkish: "Turkish",
    en: "English",
    english: "English",
  };
  const langName = LANGUAGE_NAMES[(lang || "").toLowerCase()] || "Turkish";

  const { systemPrompt, userPrompt } = buildNewsPrompt(article, langName);

  const rawResponse = await generateCompletion(userPrompt, {
    model: options.fast ? GROQ_MODELS.FAST : GROQ_MODELS.BALANCED,
    temperature: 0.35,
    maxTokens: tierConfig.maxTokensSummary,
    systemPrompt,
  });

  const cleaned = rawResponse
    .replace(/^```(?:json)?/m, "")
    .replace(/```$/m, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error(
      "[summarizeArticle] JSON parse error:",
      cleaned.slice(0, 200),
    );
    return {
      analysis: cleaned,
      keyPoints: [],
      sentiment: "neutral",
      readingTimeMinutes: 2,
      confidence: 60,
      generatedAt: new Date().toISOString(),
    };
  }

  return {
    ...parsed,
    tier: tierConfig.tier,
    generatedAt: new Date().toISOString(),
  };
}
