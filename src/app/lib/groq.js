const PROVIDERS = {
  groq: {
    name: "Groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    models: {
      FAST: "llama-3.1-8b-instant",
      BALANCED: "llama-3.3-70b-versatile",
      SMART: "llama-3.3-70b-versatile",
    },
  },
  cerebras: {
    name: "Cerebras",
    baseURL: "https://api.cerebras.ai/v1",
    apiKeyEnv: "CEREBRAS_API_KEY",
    models: {
      FAST: "llama3.1-8b",
      BALANCED: "llama3.1-8b",
      SMART: "llama3.1-8b",
    },
  },
};

const FALLBACK_ORDER = ["groq", "cerebras"];

export const GROQ_MODELS = {
  FAST: "FAST",
  BALANCED: "BALANCED",
  SMART: "SMART",
};

async function callProvider(
  providerKey,
  modelTier,
  messages,
  temperature,
  maxTokens,
) {
  const provider = PROVIDERS[providerKey];
  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) throw new Error(`SKIP: ${provider.apiKeyEnv} not set`);

  const model = provider.models[modelTier] || provider.models.BALANCED;
  const url = `${provider.baseURL}/chat/completions`;

  console.log(`[ai] Calling ${provider.name} — model: ${model}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message || body?.message || `HTTP ${res.status}`;
    console.error(`[ai] ${provider.name} error ${res.status}:`, msg);
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${provider.name} returned empty response`);
  return content.trim();
}

export async function generateCompletion(userPrompt, options = {}) {
  const {
    model: modelTier = "BALANCED",
    temperature = 0.4,
    maxTokens = 2048,
    systemPrompt,
  } = options;

  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userPrompt });

  let lastError;

  for (const providerKey of FALLBACK_ORDER) {
    try {
      return await callProvider(
        providerKey,
        modelTier,
        messages,
        temperature,
        maxTokens,
      );
    } catch (err) {
      if (err.message?.startsWith("SKIP:")) continue;
      if (err.status === 429) {
        console.warn(
          `[ai] ${PROVIDERS[providerKey].name} rate limit — sonraki provider'a geçiliyor`,
        );
        lastError = err;
        continue;
      }
      // 404 veya diğer hatalar da bir sonrakine geçsin
      console.error(
        `[ai] ${PROVIDERS[providerKey].name} başarısız (${err.status}), sonraki deneniyor`,
      );
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error("Tüm AI provider'ları başarısız oldu");
}
