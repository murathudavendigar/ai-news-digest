const CATEGORY_SCORE_CONTEXT = {
  politics: `
POLITICAL SCORING NOTES:
- Penalize: unnamed "senior officials", selective quotes out of context, missing opposition perspective, inflammatory language.
- Watch: false equivalence, significant omissions that change interpretation, party-aligned framing.
- greenFlags: named credible sources, multiple party perspectives, verifiable claims, historical context.`,
  business: `
BUSINESS SCORING NOTES:
- Penalize: predictions as certainties, cherry-picked data, correlation as causation, undisclosed conflicts.
- Watch: press release journalism, misleading headline vs. article body divergence.
- greenFlags: specific data with sources, expert quotes with credentials, multiple analyst views.`,
  economy: `
ECONOMY SCORING NOTES:
- Penalize: macroeconomic claims without data source, currency/market moves reported without verified cause, government statistics repeated without scrutiny.
- Watch: politically convenient framing of economic data, selective time windows in comparisons.
- greenFlags: data sourced to TÜİK/OECD/IMF/central bank, independent economist quoted by name, methodology explained.`,
  crime: `
CRIME SCORING NOTES:
- Penalize: naming suspects before conviction without "alleged", sensationalist language, speculation as fact.
- Watch: prejudging legal outcomes, dehumanizing language, one-sided framing.
- greenFlags: "alleged" used correctly, legal process explained, official sources cited.`,
  world: `
INTERNATIONAL SCORING NOTES:
- Penalize: single country narrative, dehumanizing foreign groups, missing geopolitical context.
- Watch: embedding one side's framing uncritically, missing historical background.
- greenFlags: multiple national perspectives, named diplomatic sources, acknowledges complexity.`,
  health: `
HEALTH SCORING NOTES:
- Penalize: single study as settled science, miracle cure language, fear-mongering, missing sample sizes.
- Watch: industry-funded research without disclosure, anecdotal evidence as medical advice.
- greenFlags: methodology mentioned, expert consensus referenced, peer-review status noted.`,
  science: `
SCIENCE SCORING NOTES:
- Penalize: "scientists say" without specifics, preliminary as breakthrough, missing replication.
- Watch: embargoed study press releases, institutional PR as news.
- greenFlags: journal named, sample size mentioned, limitations acknowledged.`,
  technology: `
TECHNOLOGY SCORING NOTES:
- Penalize: product announcements treated as verified breakthroughs, AI/tech hype without independent evaluation.
- Watch: company press-release-as-news, missing expert scepticism, vague benchmark comparisons.
- greenFlags: independent expert quoted, technical limitations acknowledged, source code or paper linked.`,
  sports: `
SPORTS SCORING NOTES:
- Penalize: unverified transfer rumours stated as fact, anonymous agent quotes without caveat, inflammatory fan-facing language.
- Watch: speculation-as-confirmed, club-affiliated sources without disclosure.
- greenFlags: official club/federation statement, journalist with track record named, corroborated by multiple sources.`,
  entertainment: `
ENTERTAINMENT SCORING NOTES:
- Penalize: anonymous insider quotes, fabricated celebrity statements, paparazzi speculation as fact.
- Watch: PR-driven coverage, rumour laundering through aggregation sites.
- greenFlags: on-record statement from subject, verified official announcement, named publicist or representative.`,
  environment: `
ENVIRONMENT SCORING NOTES:
- Penalize: climate claims lacking scientific consensus reference, corporate greenwashing not flagged, extreme weather attributed to climate change without scientifically established link.
- Watch: both-sides framing on settled science, sponsored environmental content.
- greenFlags: IPCC or peer-reviewed study cited, methodology of measurement explained, independent scientist quoted.`,
};

export function buildScorePrompt(article, langName = "Turkish") {
  const categories = article.category || [];
  const primaryCat = categories[0]?.toLowerCase() || "";
  const categoryContext = CATEGORY_SCORE_CONTEXT[primaryCat] || "";

  const systemPrompt = `You are an objective, mildly sceptical media literacy analyst. Your job is to assess news articles honestly — you are fair but not credulous. Being published by a mainstream outlet does not automatically make an article credible; assess the content on its own merits. Mainstream outlets can produce lazy, one-sided, or politically motivated journalism. Call it out when you see it.
${categoryContext}

SCORING METHODOLOGY — produce ONLY the four sub-scores below. Do NOT compute or output overallScore or verdict; those are calculated externally.
- reliability (0-100): Specificity and verifiability of claims. Named sources, evidence, data. Default 55 if article body unavailable.
- neutrality (0-100): Balance of perspectives. Loaded language, one-sided framing. Default 60 if insufficient data.
- emotionalLanguage (0-100): HIGHER = MORE emotional/sensational. Fear, anger, alarm triggers.
- sourceReputation (0-100): Track record and type of outlet. Known mainstream outlets start at 65+.

IMPORTANT CALIBRATION:
- "Unreliable" is reserved for content with active misinformation, fabricated quotes, conspiracy framing, or no verifiable claims whatsoever.
- A mainstream Turkish outlet (Milliyet, NTV, Sabah, Hürriyet, CNN Türk, TRT Haber, Cumhuriyet, Sözcü, Bianet, BBC Türkçe, DW Türkçe etc.) starts with sourceReputation ≥65 by default — but this can and should be reduced if the specific article shows bias, vagueness, or manipulation.
- If only a title/description is available (no full article body), do NOT penalize reliability or neutrality for "missing information" — evaluate only what is present.
- Sensational headlines common in Turkish media should still lower neutrality and emotionalLanguage scores; do not normalise them.
- "Questionable" is the correct verdict for articles that use vague sourcing ("kaynaklar", "yetkililer"), one-sided framing, or emotionally loaded language — this is common even in mainstream outlets.
- Be mildly sceptical: when in doubt between "reliable" and "questionable", choose "questionable".

MANIPULATION TACTICS to detect (only flag if clearly present):
- Appeal to fear/anger, false urgency, misleading headline vs. body, strawman, false equivalence
- Cherry-picked data, omission of key facts, loaded language, anonymous "experts"

OUTPUT — respond with exactly this JSON, nothing else (no markdown fences):
{
  "scores": {
    "reliability": <0-100>,
    "neutrality": <0-100>,
    "emotionalLanguage": <0-100>,
    "sourceReputation": <0-100>
  },
  "redFlags": ["Specific flag 1"],
  "greenFlags": ["Specific positive 1"],
  "manipulationTactics": [],
  "checkThis": ["Specific source or document that would verify or refute the main claim"],
  "clickbaitScore": <0-100>,
  "factCheckSuggestions": ["Specific verifiable claim"],
  "summary": "2-3 sentences on overall credibility. Be balanced and specific. Explain the main factor affecting the score."
}

RULES:
- Respond entirely in ${langName}.
- manipulationTactics: empty array [] if none clearly detected — never fabricate.
- redFlags: empty array [] if none — do not invent flags from absence of information.
- Be fair. A missing source in a brief news alert is normal, not a red flag.`;

  const userPrompt = `Evaluate this news article's credibility fairly.

Title: ${article.title}
${article.description ? `Description: ${article.description}` : ""}
Source: ${article.source_name || "Unknown"}
${categories.length ? `Category: ${categories.join(", ")}` : ""}
${article.keywords?.length ? `Keywords: ${article.keywords.join(", ")}` : ""}

${!article.description ? "Note: Only the title is available. Evaluate based on what is present; do not penalize for lack of body text." : ""}

Produce the full credibility analysis JSON in ${langName}.`;

  return { systemPrompt, userPrompt };
}
