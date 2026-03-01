import { getTierConfig } from "./categoryConfig";
import { generateCompletion, GROQ_MODELS } from "./groq";
import { buildNewsPrompt } from "./newsPrompt";

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

  // Summarize always uses FAST (8b) — key points & sentiment don't need 70b.
  // This frees up the 70b quota exclusively for analyzeArticle context.
  const completion = await generateCompletion(userPrompt, {
    model: GROQ_MODELS.FAST,
    temperature: 0.35,
    maxTokens: tierConfig.maxTokensSummary,
    systemPrompt,
  });

  const rawResponse = completion.text;

  const cleaned = rawResponse
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Truncation repair: açık string/array/object'leri kapat
    try {
      let s = cleaned.trimEnd();
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
      if (inStr) s += '"';
      while (square > 0) {
        s += "]";
        square--;
      }
      while (curly > 0) {
        s += "}";
        curly--;
      }
      parsed = JSON.parse(s);
      console.warn("[summarizeArticle] JSON truncation repaired");
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
        aiProvider: completion.provider,
        aiModel: completion.model,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  return {
    ...parsed,
    tier: tierConfig.tier,
    aiProvider: completion.provider,
    aiModel: completion.model,
    generatedAt: new Date().toISOString(),
  };
}
