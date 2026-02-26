import { generateCompletion, GROQ_MODELS } from "./groq";
import { buildNewsSummaryPrompt } from "./newsPrompt";

export async function summarizeArticle(ctx, options = {}) {
  const { systemPrompt, userPrompt, resolvedLanguage } = buildNewsSummaryPrompt(
    ctx,
    {
      forceLanguage: options.forceLanguage,
    },
  );

  const rawResponse = await generateCompletion(userPrompt, {
    model: options.fast ? GROQ_MODELS.FAST : GROQ_MODELS.BALANCED,
    temperature: 0.35,
    maxTokens: 2048,
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
    console.error("[summarizeArticle] Failed to parse Groq response:", cleaned);
    return {
      summary: cleaned,
      keyPoints: [],
      sentiment: "neutral",
      readingTimeMinutes: 3,
      confidence: "low",
      resolvedLanguage,
      generatedAt: new Date().toISOString(),
    };
  }

  return {
    ...parsed,
    resolvedLanguage,
    generatedAt: new Date().toISOString(),
  };
}
