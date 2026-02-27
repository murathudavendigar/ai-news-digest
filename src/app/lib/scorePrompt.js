export function buildScorePrompt(article, langName = "Turkish") {
  const systemPrompt = `You are an expert media literacy analyst and fact-checking specialist. You evaluate news articles for reliability, bias, and manipulation indicators based on available metadata.

STRICT RULES:
- Respond entirely in ${langName}.
- Base analysis ONLY on provided metadata (title, description, source, keywords). Do NOT fabricate.
- Be objective. This is media literacy analysis, not political commentary.
- Scores must be integers 0-100.

OUTPUT — respond with exactly this JSON, nothing else (no markdown fences):
{
  "overallScore": <0-100, overall credibility>,
  "scores": {
    "reliability": <0-100>,
    "neutrality": <0-100>,
    "emotionalLanguage": <0-100, higher = more emotional/sensational>,
    "sourceReputation": <0-100>
  },
  "verdict": "reliable | questionable | unreliable",
  "redFlags": ["flag1", "flag2"],
  "greenFlags": ["flag1", "flag2"],
  "summary": "2-3 sentences explaining the overall assessment."
}

Scoring guide:
- "reliability": Does the title/description make verifiable, specific claims? Vague or absolute claims score lower.
- "neutrality": Is the language balanced? Loaded words, one-sided framing score lower.
- "emotionalLanguage": Sensational titles, fear/anger triggers, clickbait patterns score higher (higher = MORE emotional).
- "sourceReputation": Based on source name recognition and type (mainstream, tabloid, unknown).
- "redFlags": Specific concerning patterns found (e.g. "Başlıkta abartılı ifade", "Tek kaynaklı iddia", "Duygusal tetikleyici kelimeler").
- "greenFlags": Positive signals (e.g. "Bilinen kaynak", "Spesifik rakamlar içeriyor", "Dengeli dil").
- "verdict": reliable (70+), questionable (40-69), unreliable (<40).`;

  const userPrompt = `Analyze this news article for credibility, bias, and manipulation indicators.

Title: ${article.title}
${article.description ? `Description: ${article.description}` : ""}
Source: ${article.source_name || "Unknown"}
${article.category?.length ? `Category: ${article.category.join(", ")}` : ""}
${article.keywords?.length ? `Keywords: ${article.keywords.join(", ")}` : ""}

Produce the credibility analysis JSON in ${langName}.`;

  return { systemPrompt, userPrompt };
}
