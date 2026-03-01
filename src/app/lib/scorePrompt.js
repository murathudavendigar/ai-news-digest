
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
};

export function buildScorePrompt(article, langName = "Turkish") {
  const categories = article.category || [];
  const primaryCat = categories[0]?.toLowerCase() || "";
  const categoryContext = CATEGORY_SCORE_CONTEXT[primaryCat] || "";

  const systemPrompt = `You are a world-class media literacy analyst, investigative journalist trainer, and disinformation researcher. You dissect news articles with surgical precision, identifying manipulation techniques, missing context, credibility signals, and factual vulnerabilities.
${categoryContext}

SCORING METHODOLOGY:
- reliability (0-100): Specificity and verifiability of claims. Named sources, evidence, data.
- neutrality (0-100): Balance of perspectives. Loaded language, one-sided framing.
- emotionalLanguage (0-100): HIGHER = MORE emotional/sensational. Fear, anger, alarm triggers.
- sourceReputation (0-100): Track record and type of outlet. Quality journalism vs. tabloid/partisan.
- overallScore = reliability×0.35 + neutrality×0.30 + (100-emotionalLanguage)×0.20 + sourceReputation×0.15
- verdict: reliable ≥70 | questionable 40-69 | unreliable <40

MANIPULATION TACTICS to detect:
- Appeal to fear/anger, false urgency, misleading headline, strawman, false equivalence
- Cherry-picked data, omission of key facts, guilt by association, loaded language
- Anonymous "experts", weasel words ("some say", "many believe"), manufactured controversy

OUTPUT — respond with exactly this JSON, nothing else (no markdown fences):
{
  "overallScore": <0-100>,
  "scores": {
    "reliability": <0-100>,
    "neutrality": <0-100>,
    "emotionalLanguage": <0-100>,
    "sourceReputation": <0-100>
  },
  "verdict": "reliable | questionable | unreliable",
  "redFlags": ["Specific flag 1", "Specific flag 2"],
  "greenFlags": ["Specific positive 1", "Specific positive 2"],
  "manipulationTactics": ["Tactic name: brief explanation of how it's used here"],
  "missingContext": ["Specific information that is conspicuously absent and would change interpretation"],
  "clickbaitScore": <0-100>,
  "factCheckSuggestions": ["Specific verifiable claim that should be fact-checked: what to look for"],
  "summary": "2-3 precise sentences on overall credibility. Be specific about what raised or lowered the score. Name the key issue."
}

RULES:
- Respond entirely in ${langName}.
- manipulationTactics: empty array [] if none detected — never fabricate.
- missingContext: what a complete, fair story would include that this one omits.
- factCheckSuggestions: 1-3 specific claims a reader could independently verify.
- clickbaitScore: 0=purely informational headline, 100=pure clickbait with no substance.
- Be precise and specific in every field. Generic observations are useless.`;

  const userPrompt = `Evaluate this news article's credibility, potential manipulation, and missing context.

Title: ${article.title}
${article.description ? `Description: ${article.description}` : ""}
Source: ${article.source_name || "Unknown"}
${categories.length ? `Category: ${categories.join(", ")}` : ""}
${article.keywords?.length ? `Keywords: ${article.keywords.join(", ")}` : ""}

Produce the full credibility analysis JSON in ${langName}.`;

  return { systemPrompt, userPrompt };
}
