/**
 * Ortak AI çıktı kuralları — tüm prompt'lara eklenir.
 * Bilinmeyen bilgi uydurma yasağı + JSON-only sözleşme.
 */

export const AI_JSON_RULES = `
GLOBAL RULES (non-negotiable):
- Respond with JSON only. No markdown fences, no prose outside JSON.
- Do NOT invent facts, quotes, numbers, dates, or named sources.
- If uncertain, use null or omit the field — never guess.
- Prefer grounded claims from the provided article text only.
- Mark speculation explicitly if a field allows scenarios (e.g. whatNext).
`.trim();

export const AI_DISCLOSURE_TR =
  "Bu özet yapay zeka ile üretildi; asıl haber kaynağa aittir.";

export const AI_DISCLOSURE_SHORT_TR = "AI özet · kaynak linkte";

/** Prompt sonuna ekle */
export function withAiContract(prompt) {
  return `${prompt}\n\n${AI_JSON_RULES}`;
}

/** Görev tipi → model katmanı önerisi */
export const AI_TASK_TIERS = {
  score: "FAST",
  summarize: "BALANCED",
  analyze: "BALANCED",
  deepAnalysis: "SMART",
  translate: "BALANCED",
  digest: "SMART",
};
