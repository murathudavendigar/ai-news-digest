
const LANGUAGE_NAMES = {
  tr: "Turkish",
  turkish: "Turkish",
  en: "English",
  english: "English",
  de: "German",
  german: "German",
  fr: "French",
  french: "French",
  es: "Spanish",
  spanish: "Spanish",
  ar: "Arabic",
  arabic: "Arabic",
  ru: "Russian",
  russian: "Russian",
  zh: "Chinese (Simplified)",
};

export function resolveResponseLanguage(articleLanguage, forceLanguage) {
  const raw = (forceLanguage || articleLanguage || "en").toLowerCase();
  const name = LANGUAGE_NAMES[raw];

  return name ? { code: raw, name } : { code: "en", name: "English" };
}


export function buildSystemPrompt(responseLang) {
  return `You are an expert news analyst. You receive metadata about a news article (title, lead paragraph, source, keywords, categories) and produce a structured analysis in ${responseLang.name}.

STRICT RULES:
- Respond entirely in ${responseLang.name} (language code: ${responseLang.code}).
- The "description" field is the article's original lead/excerpt — do NOT repeat or rephrase it in "summary".
- "summary" must be your own analytical synthesis: explain the broader context, significance, and implications of the story. It should add value beyond what the description already says.
- Be objective and neutral. No speculation, no personal opinion.
- Do NOT fabricate facts not present in the metadata.
- Keep the tone professional yet accessible.

OUTPUT — respond with exactly this JSON and nothing else (no markdown fences, no extra text):
{
  "analysis": "4-6 sentences of deeper context, background, and implications. This is NOT a summary of what happened — the reader already knows that. Instead explain: why this story matters, what led to it, what the likely consequences are, and what broader trends it connects to.",
  "keyPoints": ["Full sentence fact or implication 1", "Full sentence fact or implication 2", "Full sentence fact or implication 3", "Full sentence fact or implication 4", "Full sentence fact or implication 5"],
  "sentiment": "positive | negative | neutral",
  "readingTimeMinutes": <integer>,
  "confidence": "high | medium | low"
}

Field rules:
- "analysis": pure analytical value-add. Assume the reader has already read the title and description. Do NOT restate them. Focus on context, significance, causes, and consequences.
- "keyPoints": exactly 5 full sentences. Cover: key actors involved, relevant background, potential impact, any notable data/numbers from keywords, and one broader implication.
- "sentiment": overall tone of the story.
- "readingTimeMinutes": estimated full-article reading time.
- "confidence": how confident you are based on available metadata.`;
}


export function buildUserPrompt(ctx) {
  const lines = [
    `Analyze the following news article metadata and produce a structured JSON response.`,
    ``,
    `ARTICLE METADATA:`,
    `- Title: ${ctx.title}`,
  ];

  if (ctx.description) {
    lines.push(
      `- Original Lead (do NOT restate this in your summary): ${ctx.description}`,
    );
  }

  if (ctx.sourceName) lines.push(`- Source: ${ctx.sourceName}`);
  if (ctx.publishedAt) lines.push(`- Published At: ${ctx.publishedAt}`);
  if (ctx.category?.length)
    lines.push(`- Categories: ${ctx.category.join(", ")}`);
  if (ctx.keywords?.length)
    lines.push(`- Keywords: ${ctx.keywords.join(", ")}`);

  lines.push(`- Article URL: ${ctx.sourceUrl}`);
  lines.push(``);
  lines.push(
    `Your "summary" must provide analytical context and significance — not repeat the lead paragraph above.`,
  );

  return lines.join("\n");
}


export function buildNewsSummaryPrompt(ctx, options = {}) {
  const responseLang = resolveResponseLanguage(
    ctx.language,
    options.forceLanguage,
  );

  return {
    systemPrompt: buildSystemPrompt(responseLang),
    userPrompt: buildUserPrompt(ctx),
    resolvedLanguage: responseLang.name,
  };
}
