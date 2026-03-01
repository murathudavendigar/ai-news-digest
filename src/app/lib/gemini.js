// ── Model adları — sadece buradan değiştir ────────────────────────────────
export const GEMINI_MODELS = {
  FLASH: "gemini-2.5-flash", // Ana model
  FLASH_LITE: "gemini-2.5-flash-lite",
  FLASH_2: "gemini-2.0-flash",
  PRO: "gemini-3-flash-preview",
};

// 429 / 503 / 500 durumunda bu sırayla denenir
const FALLBACK_CHAIN = [
  GEMINI_MODELS.PRO,
  GEMINI_MODELS.FLASH,
  GEMINI_MODELS.FLASH_LITE,
  GEMINI_MODELS.FLASH_2,
];

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function getKey() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY is not set");
  return k;
}

// ── Ham API çağrısı ───────────────────────────────────────────────────────
async function callGemini(model, body) {
  const url = `${BASE}/${model}:generateContent?key=${getKey()}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    const err = new Error(
      `Gemini ${res.status} [${model}]: ${txt.slice(0, 300)}`,
    );
    err.status = res.status;
    err.model = model;
    throw err;
  }

  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || "")
    .join("");
  const searches =
    data.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];
  return { text, searches };
}

// ── Fallback zinciriyle çağır ─────────────────────────────────────────────
// Geçici hatalar (429/503/500) → sıradakine geç
// Kalıcı hatalar (400) → dur, fırlat
// Bulunamadı (404) → bu modeli atla, devam et
async function callWithFallback(
  buildBody,
  preferredModel = GEMINI_MODELS.FLASH,
) {
  const startIdx = FALLBACK_CHAIN.indexOf(preferredModel);
  const queue = [
    ...FALLBACK_CHAIN.slice(startIdx >= 0 ? startIdx : 0),
    ...FALLBACK_CHAIN.slice(0, startIdx > 0 ? startIdx : 0),
  ].filter((v, i, a) => a.indexOf(v) === i); // dedupe

  let lastErr;
  for (const model of queue) {
    try {
      const result = await callGemini(model, buildBody(model));
      if (model !== preferredModel) {
        console.log(`[gemini] ✓ Fallback: ${model}`);
      }
      return result;
    } catch (err) {
      lastErr = err;
      if (err.status === 400) {
        // İstek hatalı — fallback fayda sağlamaz
        throw err;
      }
      if (err.status === 429 || err.status === 503 || err.status === 500) {
        console.warn(
          `[gemini] ${model} rate-limit/geçici hata → sonraki model`,
        );
        continue; // sıradaki modele geç
      }
      if (err.status === 404) {
        console.warn(`[gemini] ${model} bulunamadı → sonraki model`);
        continue; // sıradaki modele geç
      }
      // Bilinmeyen hata → dur
      throw err;
    }
  }
  throw lastErr ?? new Error("Tüm Gemini modelleri başarısız");
}

// ── JSON onarıcı ─────────────────────────────────────────────────────────
// Token limiti nedeniyle kesilmiş JSON'u mümkün olduğunca kapat
function repairJSON(raw) {
  // 1. Fence'leri soy
  let s = raw
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/m, "")
    .replace(/```\s*$/m, "")
    .trim();

  // 2. İlk { ... son } arasını al
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end > start) s = s.slice(start, end + 1);
  else if (start !== -1) s = s.slice(start);

  // 3. Token kesilmesi: yarım string'i kapat
  //    Son çift tırnak sayısı tekse bir açık string var demektir
  const quotes = (s.match(/(?<!\\)"/g) || []).length;
  if (quotes % 2 !== 0) s += '"';

  // 4. Sondaki yarım property'yi sil: ,"key": veya ,"key":"
  s = s.replace(/,\s*"[^"]*"\s*:\s*"?[^"}\]]*$/, "");

  // 5. Eksik kapanış bracket'larını tamamla
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

export function parseGeminiJSON(raw, label = "") {
  const repaired = repairJSON(raw);
  try {
    return JSON.parse(repaired);
  } catch (e) {
    console.error(
      `[gemini] JSON parse hatası${label ? " (" + label + ")" : ""}`,
      "\nOnarım sonrası ilk 500 karakter:\n",
      repaired.slice(0, 500),
    );
    throw new Error("JSON parse failed: " + e.message);
  }
}

// ════════════════════════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════════════════════════

/**
 * Google Search grounding ile serbest metin
 * tools → generationConfig'in DIŞINDA, ayrı üst-level field
 */
export async function generateWithGrounding(
  prompt,
  { model = GEMINI_MODELS.FLASH, temperature = 0.4, maxTokens = 8192 } = {},
) {
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    tools: [{ googleSearch: {} }], // ← üst seviye, generationConfig dışında
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  };

  try {
    const { text, searches } = await callGemini(model, body);
    if (searches.length)
      console.log("[gemini] Web searches:", searches.join(" | "));
    return text;
  } catch (err) {
    if (err.status === 429 || err.status === 503) {
      // Grounding 429 → aramasız fallback dene
      console.warn("[gemini] Grounding rate-limit → aramasız fallback");
      const { text } = await callWithFallback(
        () => ({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
        GEMINI_MODELS.FLASH_LITE,
      );
      return text;
    }
    throw err;
  }
}

/**
 * JSON üretimi — responseMimeType YOK (keser), manuel parse + onarım
 */
export async function generateJSON(
  prompt,
  {
    model = GEMINI_MODELS.FLASH,
    temperature = 0.15,
    maxTokens = 4000,
    label = "",
  } = {},
) {
  const fullPrompt = `${prompt}

ZORUNLU: Yanıt YALNIZCA geçerli JSON. Hiçbir açıklama veya \`\`\` olmayacak. İlk karakter { son karakter }.`;

  const buildBody = () => ({
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  });

  const { text } = await callWithFallback(buildBody, model);
  return parseGeminiJSON(text, label);
}
