import { getTierConfig } from "./categoryConfig";
import { generateCompletion, GROQ_MODELS, tryParseJSON } from "./groq";
import { buildNewsPrompt } from "./newsPrompt";

export async function summarizeArticle(article, options = {}) {
  const tierConfig = getTierConfig(article);
  const lang = article.language || "turkish";

  const LANGUAGE_NAMES = {
    tr: "Turkish",
    turkish: "Turkish",
    en: "English",
    english: "English",
  };
  const langName = LANGUAGE_NAMES[(lang || "").toLowerCase()] || "Turkish";

  const { systemPrompt, userPrompt } = buildNewsPrompt(article, langName);

  const completion = await generateCompletion(userPrompt, {
    model: GROQ_MODELS.FAST,
    temperature: 0.35,
    maxTokens: tierConfig.maxTokensSummary,
    systemPrompt,
  });

  const parsed = tryParseJSON(completion.text, "summarize");

  if (!parsed) {
    console.error(
      "[summarizeArticle] JSON parse error:",
      String(completion.text || "").slice(0, 200),
    );
    return {
      analysis:
        "Özet şu an üretilemedi. Kaynak haberi okuyabilir veya biraz sonra tekrar deneyebilirsin.",
      keyPoints: [],
      sentiment: "neutral",
      readingTimeMinutes: 2,
      confidence: 40,
      aiProvider: completion.provider,
      aiModel: completion.model,
      generatedAt: new Date().toISOString(),
      parseFailed: true,
    };
  }

  return {
    ...parsed,
    tier: tierConfig.tier,
    aiProvider: completion.provider,
    aiModel: completion.model,
    generatedAt: new Date().toISOString(),
  };
}
