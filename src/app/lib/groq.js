// lib/groq.js
// Multi-provider AI client — otomatik fallback zinciri
//
// Zincir:
//   1. Groq        — Llama 4 Scout 17B   — 30K TPM, 500K TPD
//   2. SambaNova   — Llama 3.3 70B       — ~1M TPD
//   3. Cerebras    — Llama 3.1 8B        — 1M TPD
//   4. OpenRouter  — free modeller       — son çare
//
// 429 veya SKIP → bir sonraki provider
// 400 (bad request) → direkt fırlat, retry etme

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

// Provider sayaçlarını pipeline ile tek roundtrip'te güncelle (fire-and-forget)
function trackProviderUsage(providerKey) {
  redis
    .pipeline()
    .incr(`stats:ai:${providerKey}:calls`)
    .incr(`stats:ai:${providerKey}:calls:today`)
    .exec()
    .catch(() => {});
}

function trackProviderError(providerKey, statusCode) {
  const pl = redis.pipeline().incr(`stats:ai:${providerKey}:errors`);
  if (statusCode === 429) pl.incr(`stats:ai:${providerKey}:rateLimits`);
  pl.exec().catch(() => {});
}

const PROVIDERS = {
  groq: {
    name: "Groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    models: {
      // llama-3.1-8b-instant  → 6K TPM, 500K TPD
      // llama-4-scout         → 30K TPM, 500K TPD  ← BALANCED için ideal
      FAST: "llama-3.1-8b-instant",
      BALANCED: "llama-3.3-70b-versatile",
      SMART: "meta-llama/llama-4-scout-17b-16e-instruct",
    },
  },

  sambanova: {
    name: "SambaNova",
    baseURL: "https://api.sambanova.ai/v1",
    apiKeyEnv: "SAMBANOVA_API_KEY",
    models: {
      FAST: "Meta-Llama-3.1-8B-Instruct",
      BALANCED: "Meta-Llama-3.3-70B-Instruct",
      SMART: "Meta-Llama-3.3-70B-Instruct",
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

  openrouter: {
    name: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKeyEnv: "OPENROUTER_API_KEY",
    models: {
      FAST: "meta-llama/llama-3.3-70b-instruct:free",
      BALANCED: "meta-llama/llama-3.3-70b-instruct:free",
      SMART: "meta-llama/llama-3.3-70b-instruct:free",
    },
  },
};

// Öncelik sırası — Groq (Scout 30K TPM) → SambaNova (~1M TPD) → Cerebras (1M TPD) → OpenRouter (son çare)
const FALLBACK_ORDER = ["groq", "cerebras", "sambanova", "openrouter"];

export const GROQ_MODELS = {
  FAST: "FAST",
  BALANCED: "BALANCED",
  SMART: "SMART",
};

// ── Tek provider çağrısı ──────────────────────────────────────────────────
async function callProvider(
  providerKey,
  modelTier,
  messages,
  temperature,
  maxTokens,
) {
  const provider = PROVIDERS[providerKey];
  const apiKey = process.env[provider.apiKeyEnv];

  if (!apiKey) {
    throw Object.assign(
      new Error(`SKIP: ${provider.apiKeyEnv} tanımlı değil`),
      { skip: true },
    );
  }

  const model = provider.models[modelTier] || provider.models.BALANCED;
  console.log(`[ai] → ${provider.name} · ${model}`);

  const res = await fetch(`${provider.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(provider.extraHeaders || {}),
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
    console.error(`[ai] ${provider.name} ${res.status}:`, msg.slice(0, 120));
    throw Object.assign(new Error(msg), { status: res.status });
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${provider.name} boş yanıt döndürdü`);

  console.log(`[ai] ✓ ${provider.name} başarılı`);
  trackProviderUsage(providerKey);
  return {
    text: content.trim(),
    provider: provider.name,
    model,
  };
}

// ── Fallback zinciri ─────────────────────────────────────────────────────
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

  for (const key of FALLBACK_ORDER) {
    try {
      return await callProvider(
        key,
        modelTier,
        messages,
        temperature,
        maxTokens,
      );
    } catch (err) {
      // API key yok — sessizce atla
      if (err.skip) {
        continue;
      }

      trackProviderError(key, err.status);

      // Rate limit → kısa bekle, sonra bir sonrakine geç
      if (err.status === 429) {
        console.warn(
          `[ai] ${PROVIDERS[key].name} rate limit (429) — 1s bekleniyor, sonraki deneniyor`,
        );
        await new Promise((r) => setTimeout(r, 1000));
        lastError = err;
        continue;
      }

      // Bad request → büyük ihtimalle prompt/model sorunu, retry etmenin anlamı yok
      if (err.status === 400) {
        console.error(
          `[ai] ${PROVIDERS[key].name} bad request (400) — zincir durduruluyor`,
        );
        throw err;
      }

      // 404, 500, 503 vb. → yine de bir sonrakine geç
      console.warn(
        `[ai] ${PROVIDERS[key].name} hata (${err.status || "?"}) — sonraki deneniyor`,
      );
      lastError = err;
    }
  }

  throw lastError || new Error("Tüm AI provider'ları başarısız oldu");
}

// ── Provider listesini dışa aç (admin stats için) ─────────────────────
export function getProviderKeys() {
  return FALLBACK_ORDER;
}

export function getProviderName(key) {
  return PROVIDERS[key]?.name || key;
}

// ── Streaming — Groq SSE forward ─────────────────────────────────────────
// Sadece Groq destekliyor. Key yoksa ya da 429 ise generateCompletion'a fallback.
export async function* streamCompletion(userPrompt, options = {}) {
  const {
    model: modelTier = "FAST",
    temperature = 0.35,
    maxTokens = 2000,
    systemPrompt,
  } = options;

  const provider = PROVIDERS.groq;
  const apiKey = process.env[provider.apiKeyEnv];

  if (!apiKey) {
    // Key yok — non-streaming fallback
    const result = await generateCompletion(userPrompt, options);
    yield result.text;
    return;
  }

  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userPrompt });

  const model = provider.models[modelTier] || provider.models.FAST;

  let res;
  try {
    res = await fetch(`${provider.baseURL}/chat/completions`, {
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
        stream: true,
      }),
      cache: "no-store",
    });
  } catch {
    const result = await generateCompletion(userPrompt, options);
    yield result.text;
    return;
  }

  if (!res.ok || !res.body) {
    // 429 veya hata — non-streaming fallback
    trackProviderError("groq", res.status);
    const result = await generateCompletion(userPrompt, options);
    yield result.text;
    return;
  }

  trackProviderUsage("groq");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value, { stream: true }).split("\n");
      for (const line of lines) {
        if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
        try {
          const data = JSON.parse(line.slice(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {}
      }
    }
  } finally {
    reader.releaseLock();
  }
}
