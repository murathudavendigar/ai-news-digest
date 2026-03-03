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
  economy: `MACROECONOMIC CONTEXT FRAMEWORK:
- Fiscal and monetary backdrop: current interest rates, inflation trend, budget balance
- Recent policy decisions: TCMB, Hazine, IMF arrangements if any
- Historical parallel: which prior Turkish economic episode most resembles this?
- Political economy: whose interests does the current policy serve?
- External exposure: how sensitive is Turkey's current account/FX position to this development?`,
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
  sports: `SPORTS CONTEXT FRAMEWORK:
- Club/federation history: relevant institutional background
- Financial dimension: ownership, debt, sponsorship interests at stake
- Regulatory body: UEFA, FIFA, TFF involvement and track record
- Political dimension: sports-politics intersection in Turkish context
- Precedent: has this club/player/federation faced a similar situation before?`,
  entertainment: `ENTERTAINMENT/CULTURE CONTEXT FRAMEWORK:
- Industry structure: who controls distribution and financing in this sector
- Cultural politics: what societal tensions does this story reflect or amplify?
- Precedent: similar controversies in Turkish or global entertainment?
- Economic interests: box office, streaming rights, brand deals at stake
- Regulatory context: RTÜK or other content regulation history`,
  environment: `ENVIRONMENT CONTEXT FRAMEWORK:
- Scientific consensus: what do peer-reviewed findings say on this specific issue?
- Policy history: Turkey's environmental commitments, Paris Agreement status, relevant laws
- Corporate interests: which industries stand to gain or lose from this development?
- Historical damage: verified prior environmental incidents in this region or sector
- Enforcement record: has regulation in this area actually been enforced?`,
};

export function buildContextPrompt(article, langName = "Turkish") {
  const categories = article.category || [];
  const primaryCat = categories[0]?.toLowerCase() || "";
  const framework = CATEGORY_CONTEXT_FRAMEWORK[primaryCat] || "";

  const systemPrompt = `You are a rigorous, independent analyst. Your method is strictly evidence-based: you only draw on verified, publicly documented facts — established historical events, signed treaties, official statements on the record, published data. You explicitly refuse to treat rumours, anonymous allegations, or speculative narratives as context. When a fact is uncertain, you either omit it or flag it clearly with phrases like "iddia edildiğine göre" (allegedly) or "doğrulanmamış" (unverified). Your tone is calm, objective, and mildly sceptical of all actors — you question official narratives as readily as opposition claims.

CRITICAL RULES FOR CONTEXT:
- VERIFIED FACTS ONLY: Use only events and facts that are publicly documented and widely corroborated. Do NOT present unverified allegations, anonymous claims, or speculative theories as established context.
- SCEPTICAL BY DEFAULT: Treat every actor's stated motive with equal scepticism. Do not assume good faith for any government, institution, company, or individual.
- NO NARRATIVE LAUNDERING: Do not echo the framing of the article's source. Analyse the story independently.
- UNCERTAINTY IS HONEST: If the historical record is unclear, say so. Silence is better than a fabricated fact.
- CRITICAL PERSPECTIVE: Identify who benefits most from the current framing of the story, and flag it.

${framework}

OUTPUT — respond with exactly this JSON, nothing else (no markdown fences):
{
  "oneLiner": "One clear, neutral, factual sentence capturing what this story is actually about. Informative, not dramatic.",

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

  "relatedTopics": [
    {
      "topic": "A subject or ongoing issue the reader should also follow",
      "whyFollow": "One sentence explaining the factual connection to this story."
    }
  ]
}

RULES:
- Respond entirely in ${langName}.
- timeline: 3-5 entries, oldest to most recent. Only include events that are VERIFIED and publicly documented. No speculation.
- keyActors: 2-4 entries. Include non-obvious or hidden-interest actors. Mark motives as "iddia edilen" if unverified.
- scenarios: exactly 2 entries — based only on established patterns and documented precedents, not wishes or fears.
- whyNow: if the timing is unclear or suspiciously convenient, say so explicitly.
- terminology: 1-3 terms. Only include if genuinely useful context.
- relatedTopics: 2-3 entries. Use general topic descriptions, NOT fabricated news headlines.
- Be analytically specific. Name things, quantify where possible.
- Use approximate language for uncertain dates ("around 2018", "in recent years") — never fabricate specifics.
- If a claim in the article itself is suspicious or unverifiable, note it under biggerPicture or rootCause rather than repeating it as fact.`;

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
