import { devLog, devWarn } from "@/app/lib/devLog";
import { siteConfig } from "@/app/lib/siteConfig";
// lib/groq.js
// Multi-provider AI client — otomatik fallback zinciri (yalnızca ücretsiz modeller)
//
// Zincir:
//   1. Groq        — GROQ_API_KEY
//   2. Groq-2      — GROQ_API_KEY_2 (ayrı RPM/RPD)
//   3. Cerebras    — public free/preview models
//   4. SambaNova   — free tier (402 → uzun cooldown)
//   5. OpenRouter  — openrouter/free + :free modeller
//
// 429 → kısa bekle, sonrakine geç
// 401/402/404 (model yok) → Redis cooldown, sonrakine geç
// 400 (bad request) → direkt fırlat

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const COOLDOWN_KEY = (providerKey) => `ai:cooldown:${providerKey}`;
const COOLDOWN_SOFT_SEC = 30 * 60; // 30 dk — 404 model / geçici erişim
const COOLDOWN_HARD_SEC = 6 * 60 * 60; // 6 saat — 401/402 billing
const COOLDOWN_RATE_SEC = 45; // 45 sn — 429 rate limit (aynı provider'ı spam etme)

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

async function isProviderCooledDown(providerKey) {
  try {
    const until = await redis.get(COOLDOWN_KEY(providerKey));
    if (!until) return false;
    const ts = Number(until);
    if (!Number.isFinite(ts)) return false;
    if (Date.now() < ts) return true;
    await redis.del(COOLDOWN_KEY(providerKey)).catch(() => {});
    return false;
  } catch {
    return false;
  }
}

async function setProviderCooldown(providerKey, seconds, reason) {
  const until = Date.now() + seconds * 1000;
  try {
    await redis.set(COOLDOWN_KEY(providerKey), String(until), {
      ex: seconds,
    });
    devWarn(
      `[ai] ${PROVIDERS[providerKey].name} cooldown ${Math.round(seconds / 60)}dk — ${reason}`,
    );
  } catch {
    // Redis yoksa yine de bu request'te skip edilir (caller continue eder)
  }
}

const PROVIDERS = {
  // Groq free tier (2026-07 kota): 8b = 14.4K RPD; 70b/oss/qwen = 1K RPD
  // prompt-guard / safeguard üretim için kullanılmıyor
  groq: {
    name: "Groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    models: {
      // Yüksek RPD — body refine / skor
      FAST: ["llama-3.1-8b-instant", "openai/gpt-oss-20b"],
      // Orta kalite — özet / analiz
      BALANCED: [
        "qwen/qwen3.6-27b",
        "openai/gpt-oss-20b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
      ],
      // En güçlü Groq free
      SMART: [
        "openai/gpt-oss-120b",
        "llama-3.3-70b-versatile",
        "qwen/qwen3.6-27b",
        "openai/gpt-oss-20b",
      ],
    },
  },

  // İkinci Groq hesabı — RPM/RPD kotası ayrı
  groq2: {
    name: "Groq-2",
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY_2",
    models: {
      FAST: ["llama-3.1-8b-instant", "openai/gpt-oss-20b"],
      BALANCED: [
        "qwen/qwen3.6-27b",
        "openai/gpt-oss-20b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
      ],
      SMART: [
        "openai/gpt-oss-120b",
        "llama-3.3-70b-versatile",
        "qwen/qwen3.6-27b",
        "openai/gpt-oss-20b",
      ],
    },
  },

  sambanova: {
    name: "SambaNova",
    baseURL: "https://api.sambanova.ai/v1",
    apiKeyEnv: "SAMBANOVA_API_KEY",
    models: {
      FAST: ["Meta-Llama-3.1-8B-Instruct"],
      BALANCED: ["Meta-Llama-3.3-70B-Instruct", "Meta-Llama-3.1-8B-Instruct"],
      SMART: ["Meta-Llama-3.3-70B-Instruct"],
    },
  },

  cerebras: {
    name: "Cerebras",
    baseURL: "https://api.cerebras.ai/v1",
    apiKeyEnv: "CEREBRAS_API_KEY",
    // Public catalog (2026-07): llama3.1-8b kaldırıldı
    models: {
      FAST: ["gemma-4-31b", "gpt-oss-120b"],
      BALANCED: ["gemma-4-31b", "gpt-oss-120b"],
      SMART: ["gpt-oss-120b", "gemma-4-31b"],
    },
  },

  openrouter: {
    name: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKeyEnv: "OPENROUTER_API_KEY",
    // free catalog değişir — openrouter/free router + güncel :free slug'lar
    models: {
      FAST: [
        "openrouter/free",
        "openai/gpt-oss-20b:free",
        "nvidia/nemotron-nano-9b-v2:free",
        "google/gemma-4-31b-it:free",
      ],
      BALANCED: [
        "openrouter/free",
        "google/gemma-4-31b-it:free",
        "openai/gpt-oss-20b:free",
        "nvidia/nemotron-nano-9b-v2:free",
      ],
      SMART: [
        "openrouter/free",
        "google/gemma-4-31b-it:free",
        "openai/gpt-oss-20b:free",
      ],
    },
    extraHeaders: {
      "HTTP-Referer": siteConfig.url,
      "X-Title": siteConfig.name,
    },
  },
};

// Groq ×2 önce (ayrı kota), sonra diğer free provider'lar
const FALLBACK_ORDER = ["groq", "groq2", "cerebras", "sambanova", "openrouter"];

export const GROQ_MODELS = {
  FAST: "FAST",
  BALANCED: "BALANCED",
  SMART: "SMART",
};

function resolveModelList(provider, modelTier) {
  const entry = provider.models[modelTier] || provider.models.BALANCED;
  return Array.isArray(entry) ? entry : [entry];
}

async function callProviderOnce(
  providerKey,
  model,
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

  devLog(`[ai] → ${provider.name} · ${model}`);

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
    console.error(`[ai] ${provider.name} ${res.status}:`, msg.slice(0, 160));
    throw Object.assign(new Error(msg), { status: res.status, model });
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${provider.name} boş yanıt döndürdü`);

  devLog(`[ai] ✓ ${provider.name} başarılı (${model})`);
  trackProviderUsage(providerKey);
  return {
    text: content.trim(),
    provider: provider.name,
    model,
  };
}

async function callProvider(
  providerKey,
  modelTier,
  messages,
  temperature,
  maxTokens,
) {
  const provider = PROVIDERS[providerKey];
  const models = resolveModelList(provider, modelTier);
  let lastError;

  for (const model of models) {
    try {
      return await callProviderOnce(
        providerKey,
        model,
        messages,
        temperature,
        maxTokens,
      );
    } catch (err) {
      if (err.skip) throw err;
      lastError = err;

      // Model yok / free kalktı → aynı provider'da sonraki modele geç
      if (err.status === 404) {
        devWarn(
          `[ai] ${provider.name} model yok (${model}) — provider içi sonraki deneniyor`,
        );
        continue;
      }

      // Diğer hatalar provider seviyesinde ele alınır
      throw err;
    }
  }

  throw lastError || new Error(`${provider.name}: tüm modeller başarısız`);
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

  for (const key of FALLBACK_ORDER) {
    if (await isProviderCooledDown(key)) {
      devWarn(`[ai] ${PROVIDERS[key].name} cooldown aktif — atlandı`);
      continue;
    }

    try {
      return await callProvider(
        key,
        modelTier,
        messages,
        temperature,
        maxTokens,
      );
    } catch (err) {
      if (err.skip) {
        continue;
      }

      trackProviderError(key, err.status);

      if (err.status === 429) {
        devWarn(
          `[ai] ${PROVIDERS[key].name} rate limit (429) — cooldown ${COOLDOWN_RATE_SEC}s, sonraki deneniyor`,
        );
        await setProviderCooldown(
          key,
          COOLDOWN_RATE_SEC,
          `429 ${err.message?.slice(0, 60) || "rate limit"}`,
        );
        await new Promise((r) => setTimeout(r, 400));
        lastError = err;
        continue;
      }

      if (err.status === 400) {
        console.error(
          `[ai] ${PROVIDERS[key].name} bad request (400) — zincir durduruluyor`,
        );
        throw err;
      }

      // Billing / auth / model katalog tamamen ölü
      if (err.status === 401 || err.status === 402) {
        await setProviderCooldown(
          key,
          COOLDOWN_HARD_SEC,
          `${err.status} ${err.message?.slice(0, 80) || ""}`,
        );
        lastError = err;
        continue;
      }

      if (err.status === 404) {
        await setProviderCooldown(
          key,
          COOLDOWN_SOFT_SEC,
          `404 ${err.message?.slice(0, 80) || "model unavailable"}`,
        );
        lastError = err;
        continue;
      }

      // 500/503 vb.
      devWarn(
        `[ai] ${PROVIDERS[key].name} hata (${err.status || "?"}) — sonraki deneniyor`,
      );
      lastError = err;
    }
  }

  throw lastError || new Error("Tüm AI provider'ları başarısız oldu");
}

function repairJSON(raw) {
  let s = raw
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/m, "")
    .replace(/```\s*$/m, "")
    .trim();

  // Prose + JSON karışımı: ilk { / [ ile son } / ] arasını al
  const firstBrace = s.indexOf("{");
  const firstBracket = s.indexOf("[");
  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = s.lastIndexOf("}");
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = s.lastIndexOf("]");
  }

  if (start !== -1 && end > start) s = s.slice(start, end + 1);
  else if (start !== -1) s = s.slice(start);

  const quotes = (s.match(/(?<!\\)"/g) || []).length;
  if (quotes % 2 !== 0) s += '"';

  s = s.replace(/,\s*"[^"]*"\s*:\s*"?[^"}\]]*$/, "");

  const stack = [];
  for (const ch of s) {
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
  }
  for (let i = stack.length - 1; i >= 0; i--) {
    s += stack[i] === "{" ? "}" : "]";
  }

  return s;
}

/**
 * Model yanıtından JSON çıkarır. Başarısızsa null döner (throw etmez).
 */
export function tryParseJSON(raw, label = "") {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  // Safety / boş / net JSON olmayan kısa yanıtlar
  if (
    trimmed.length < 2 ||
    /^(user safety|safe|unsafe|blocked)\b/i.test(trimmed)
  ) {
    return null;
  }
  try {
    return parseJSON(trimmed, label);
  } catch {
    return null;
  }
}

export function parseJSON(raw, label = "") {
  const repaired = repairJSON(raw);
  try {
    return JSON.parse(repaired);
  } catch (e) {
    console.error(
      `[ai] JSON parse hatası${label ? " (" + label + ")" : ""}`,
      "\nOnarım sonrası:\n",
      repaired.slice(0, 500),
    );
    throw new Error("JSON parse failed: " + e.message);
  }
}

export async function generateJSON(prompt, options = {}) {
  const { label = "json-gen", ...rest } = options;
  const jsonPrompt = `${prompt}\n\nZORUNLU: Yanıt YALNIZCA geçerli bir JSON objesi veya dizisi olmalıdır. Açıklama, giriş veya \`\`\` blokları ekleme. İlk karakter { veya [ olmalı.`;

  const result = await generateCompletion(jsonPrompt, {
    ...rest,
    temperature: options.temperature ?? 0.1,
  });

  return parseJSON(result.text, label);
}

export function getProviderKeys() {
  return FALLBACK_ORDER;
}

export function getProviderName(key) {
  return PROVIDERS[key]?.name || key;
}

export async function* streamCompletion(userPrompt, options = {}) {
  const {
    model: modelTier = "FAST",
    temperature = 0.35,
    maxTokens = 2000,
    systemPrompt,
  } = options;

  // Stream: önce Groq, sonra Groq-2; olmazsa non-stream fallback zinciri
  const streamKeys = ["groq", "groq2"];

  for (const key of streamKeys) {
    const provider = PROVIDERS[key];
    const apiKey = process.env[provider.apiKeyEnv];
    if (!apiKey || (await isProviderCooledDown(key))) continue;

    const messages = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: userPrompt });

    const model = resolveModelList(provider, modelTier)[0];

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
      continue;
    }

    if (!res.ok || !res.body) {
      trackProviderError(key, res.status);
      if (res.status === 401 || res.status === 402) {
        await setProviderCooldown(key, COOLDOWN_HARD_SEC, `stream ${res.status}`);
      } else if (res.status === 429) {
        await setProviderCooldown(key, COOLDOWN_RATE_SEC, `stream 429`);
      }
      continue;
    }

    trackProviderUsage(key);
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
    return;
  }

  const result = await generateCompletion(userPrompt, options);
  yield result.text;
}
