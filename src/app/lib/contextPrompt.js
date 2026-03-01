const CATEGORY_CONTEXT_FRAMEWORK = {
  politics: `POLITICAL CONTEXT FRAMEWORK:
- Map power landscape: factions, parties, power centers involved
- Policy history: what decisions, laws, events led here
- Political cycle: where is this in electoral or governing cycle
- Power question: who had power before, who has it now, who wants it next
- International dimension: what foreign actors have interests in this domestic situation`,
  business: `ECONOMIC CONTEXT FRAMEWORK:
- Economic cycle: growth, inflation, interest rates context
- Sector history: what shaped this industry over recent years
- Policy lineage: what government/central bank decisions created current conditions
- Global linkage: what international economic trends connect here
- Previous crises: has this sector faced similar pressures? What happened?`,
  crime: `CRIME/JUSTICE CONTEXT FRAMEWORK:
- Institutional history: track record of law enforcement/judiciary involved
- Pattern recognition: crime wave, organized network, or recurring failure?
- Policy context: what laws or social policies are relevant background
- Socioeconomic roots: inequality, poverty, social conditions in background
- High-profile precedents: similar cases prosecuted? What was outcome?`,
  world: `GEOPOLITICAL CONTEXT FRAMEWORK:
- Historical roots: colonial history, wars, treaties that shaped this relationship
- Alliance structures: blocs, pacts, alignments in play
- Resource and economic interests: trade, energy, financial interests at stake
- Previous flashpoints: similar crises in region? How were they resolved?
- Turkey's historical relationship: specific history between Turkey and actors involved`,
  health: `PUBLIC HEALTH CONTEXT FRAMEWORK:
- Epidemiological background: baseline statistics for this condition/threat
- Historical precedent: similar outbreaks or health crises before?
- Healthcare system capacity: ability to respond
- Vulnerable populations: who is historically most at risk
- Policy history: current health policies and how we got here`,
  technology: `TECHNOLOGY CONTEXT FRAMEWORK:
- Technology genealogy: previous technologies/research that paved the way
- Failed predecessors: similar technologies hyped before that failed? Why?
- Market structure: companies and interests dominating this space
- Regulatory history: how has regulation evolved in this area
- Social adoption patterns: how have similar technologies been adopted or rejected`,
};

export function buildContextPrompt(article, langName = "Turkish") {
  const categories = article.category || [];
  const primaryCat = categories[0]?.toLowerCase() || "";
  const framework = CATEGORY_CONTEXT_FRAMEWORK[primaryCat] || "";

  const systemPrompt = `You are a senior analyst, historian, and strategic forecaster with encyclopedic knowledge of current events, geopolitics, economics, and social history. You don't just explain what happened — you map the forces that made it inevitable, identify who benefits, and project where this leads.

${framework}

OUTPUT — respond with exactly this JSON, nothing else (no markdown fences):
{
  "oneLiner": "One punchy, memorable sentence capturing the essence and why it matters RIGHT NOW. Make it quotable.",

  "timeline": [
    {
      "period": "Specific time label",
      "event": "What happened — specific, not vague",
      "relevance": "Why this past event matters for understanding TODAY's story. Connect explicitly."
    }
  ],

  "rootCause": "2-3 sentences on the fundamental underlying cause — not the proximate trigger, but the deep structural reason. Be analytically bold.",

  "keyActors": [
    {
      "name": "Actor name",
      "role": "Specific role in this story",
      "interest": "What they concretely want or stand to gain/lose. Be specific about motivations.",
      "powerLevel": "dominant | significant | peripheral"
    }
  ],

  "whyNow": "1-2 sentences: what specific confluence of factors made THIS the moment. Why not 6 months ago?",

  "scenarios": [
    {
      "label": "En Olası Senaryo",
      "probability": "high | medium | low",
      "description": "2 sentences: what happens next if the dominant trajectory continues.",
      "indicator": "One specific thing to watch that would confirm this scenario."
    },
    {
      "label": "Alternatif Senaryo",
      "probability": "medium | low",
      "description": "2 sentences: what happens if a key variable changes.",
      "indicator": "One specific thing to watch that would signal this path."
    }
  ],

  "terminology": [
    {
      "term": "A term or concept central to this story that readers may not know",
      "definition": "Clear 1-2 sentence definition in plain language, connected to this specific story."
    }
  ],

  "biggerPicture": "2-3 sentences connecting this story to a broader trend — regional, global, historical, or structural. Make the reader feel they understand something about how the world works.",

  "relatedStories": [
    {
      "title": "A related story or issue readers should also follow",
      "connection": "One sentence explaining how it connects to this story."
    }
  ]
}

RULES:
- Respond entirely in ${langName}.
- timeline: 3-5 entries, oldest to most recent.
- keyActors: 2-4 entries. Include non-obvious actors if relevant.
- scenarios: exactly 2 entries — the most likely path and one plausible alternative.
- terminology: 1-3 terms. Only include if genuinely useful context.
- relatedStories: 2-3 entries.
- Be analytically specific. Name things, quantify where possible.
- Use approximate language for uncertain dates ("around 2018", "in recent years") — never fabricate specifics.`;

  const userPrompt = `Provide deep historical context, actor analysis, future scenarios, and related intelligence for this news story.

Title: ${article.title}
${article.description ? `Description: ${article.description}` : ""}
${article.source_name ? `Source: ${article.source_name}` : ""}
${categories.length ? `Category: ${categories.join(", ")}` : ""}
${article.keywords?.length ? `Keywords: ${article.keywords.join(", ")}` : ""}
${article.pubDate ? `Published: ${article.pubDate}` : ""}

Produce the full context chain analysis in ${langName}.`;

  return { systemPrompt, userPrompt };
}
