import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY environment variable is not set.");
}

export const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const GROQ_MODELS = {
  FAST: "llama-3.1-8b-instant",
  BALANCED: "llama-3.3-70b-versatile",
  SMART: "deepseek-r1-distill-llama-70b",
};

export async function generateCompletion(userPrompt, options = {}) {
  const {
    model = GROQ_MODELS.BALANCED,
    temperature = 0.4,
    maxTokens = 2048,
    systemPrompt,
  } = options;

  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userPrompt });

  const response = await groqClient.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty response.");
  return content.trim();
}
