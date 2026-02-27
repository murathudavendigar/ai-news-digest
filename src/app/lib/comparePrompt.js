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
};

function resolveLanguage(lang) {
  const raw = (lang || "turkish").toLowerCase();
  return LANGUAGE_NAMES[raw] || "Turkish";
}

export function buildComparePrompt(original, others, language = "turkish") {
  const langName = resolveLanguage(language);

  const systemPrompt = `You are an expert media analyst specializing in comparative journalism. 
Your job is to analyze how different news sources cover the same event and identify differences in framing, emphasis, tone, and perspective.

STRICT RULES:
- Respond entirely in ${langName}.
- Be objective. Do not favor any source.
- Focus on journalistic differences: what each source emphasizes, omits, or frames differently.
- Do NOT summarize each article individually — compare them against each other.
- Base analysis only on provided metadata. Do not fabricate.

OUTPUT — respond with exactly this JSON, nothing else (no markdown fences):
{
  "commonGround": "2-3 sentences about what all sources agree on — the undisputed facts.",
  "differences": [
    {
      "aspect": "Short label for this difference (e.g. 'Tone', 'Emphasis', 'Omitted details')",
      "analysis": "2-3 sentences explaining how sources differ on this aspect."
    }
  ],
  "sourcePerspectives": [
    {
      "source": "Source name",
      "stance": "one word: neutral / critical / supportive / alarmist / optimistic",
      "note": "One sentence describing this source's unique angle or framing."
    }
  ],
  "overallVerdict": "2-3 sentences. What does reading all sources together reveal that no single source shows alone?",
  "biasWarning": "null or a one-sentence warning if any source shows clear bias or one-sided framing."
}

"differences" array must have 3-5 items. "sourcePerspectives" must include ALL sources provided.`;

  const allArticles = [original, ...others];
  const articlesText = allArticles
    .map((a, i) => {
      const label = i === 0 ? "SOURCE 0 (Original)" : `SOURCE ${i}`;
      return [
        `--- ${label} ---`,
        `Source Name: ${a.source_name || a.sourceName || "Unknown"}`,
        `Title: ${a.title}`,
        a.description ? `Lead: ${a.description}` : null,
        a.keywords?.length ? `Keywords: ${a.keywords.join(", ")}` : null,
        a.category?.length ? `Category: ${a.category.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  const userPrompt = `Compare how these ${allArticles.length} news sources cover the same event. Identify journalistic differences in framing, emphasis, tone, and perspective.

${articlesText}

Produce the JSON comparison analysis in ${langName}.`;

  return { systemPrompt, userPrompt };
}
