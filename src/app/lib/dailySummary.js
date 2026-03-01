
import { Redis } from "@upstash/redis";
import { generateWithGrounding, generateJSON, GEMINI_MODELS } from "./gemini";
import { getLatest } from "./news";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const KEY_PREFIX = "daily-summary-v5";

function todayKey() {
  return `${KEY_PREFIX}:${new Date().toISOString().slice(0, 10)}`;
}

function todayFormatted() {
  return new Date().toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function ttlUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 1000) + 3600;
}

function calcIssueNumber() {
  return Math.floor((new Date() - new Date("2026-01-01")) / 86_400_000) + 1;
}

// Hata durumunda null dön, crash etme
async function safeJSON(prompt, opts, label) {
  try {
    return await generateJSON(prompt, { ...opts, label });
  } catch (err) {
    console.error(`[dailySummary] "${label}" başarısız:`, err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
export async function getDailySummary() {
  try {
    const cached = await redis.get(todayKey());
    if (cached) return { ...cached, fromCache: true };
  } catch (err) {
    console.error("[dailySummary] Redis GET:", err.message);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
export async function generateDailySummary() {
  const newsData = await getLatest("tr");
  const articles = (newsData.results || []).slice(0, 25);
  if (!articles.length) return { error: "no_articles" };

  const today = todayFormatted();

  const articleList = articles
    .map((a, i) =>
      [
        `[${i + 1}] ${a.source_name || "?"}`,
        a.title,
        a.description?.slice(0, 100),
        a.category?.join("/"),
        a.image_url ? `IMG:${a.image_url}` : null,
      ]
        .filter(Boolean)
        .join(" | ")
    )
    .join("\n");

  // ══════════════════════════════════════════════════
  // AŞAMA 1 — Google Search grounding → ham metin
  // ══════════════════════════════════════════════════
  const groundingPrompt = `Sen Türkiye'nin en deneyimli haber editörüsün. Bugün ${today} gazete ön sayfası için analiz yapıyorsun.

ELİNDEKİ HABERLER:
${articleList}

Google Search ile şunları araştır ve hem elimizdeki haberler HEM DE arama sonuçlarını kullanarak aşağıdaki başlıklar altında düz metin yaz:

**MANŞET**: Tek çarpıcı cümle.
**ALT BAŞLIK**: İkinci gelişme, 1 cümle.
**GÜNÜN MOOODU**: tense / hopeful / turbulent / calm / critical / uncertain / positive
**GİRİŞ**: 4-5 cümle analitik paragraf.
**ZORUNLU OKU** (5-6 haber): SIRA|BAŞLIK|NEDEN(2 cümle)|critical veya high|kategori|GÖRSEL_URL
**KATEGORİLER** (5 bölüm): EMOJİ|AD|ÖZET(3 cümle)|MANŞET|haberler|ÖNGÖRÜ
**BÜYÜK TABLO**: 2-3 cümle ortak tema.
**GÜNÜN SAYISI**: rakam|bağlam
**GÜNÜN KAVRAMI**: Türkçe kavram|tanım
**İSTANBUL HAVA**: durum|sıcaklık|not
**PİYASALAR**: BIST-100 değeri|USD/TRY|EUR/TRY
**DÜNYA** (3 haber): başlık|ülke|özet
**TARİHTE BUGÜN**: yıl|olay|önem
**GÜNÜN SÖZÜ**: alıntı|kişi|bağlam
**EDİTÖR NOTU**: 2-3 cümle özgün analiz.`;

  let groundedText;
  try {
    groundedText = await generateWithGrounding(groundingPrompt, {
      model: GEMINI_MODELS.FLASH,
      temperature: 0.45,
      maxTokens: 10000,
    });
  } catch (err) {
    console.error("[dailySummary] Grounding başarısız:", err.message);
    return { error: "grounding_failed", message: err.message };
  }

  const ctx = groundedText.slice(0, 5000);

  // ══════════════════════════════════════════════════
  // AŞAMA 2 — 4 paralel küçük JSON çağrısı
  // Her biri kendi alanlarını üretir, kesilme riski minimize
  // ══════════════════════════════════════════════════

  // A: Manşet + mood + giriş + mustRead + sections  (en büyük alan)
  const pA = `Bu haber analizinden JSON üret. SADECE JSON. { ile başla } ile bit.

${ctx}

{"headline":"tek cümle manşet","subheadline":"alt başlık","dayMood":"tense|hopeful|turbulent|calm|critical|uncertain|positive","intro":"4-5 cümle","bigPicture":"2-3 cümle","mustRead":[{"rank":1,"title":"başlık","why":"2 cümle","impact":"critical|high","category":"politics|business|world|crime|health|technology|other","imageUrl":"url veya null"}],"sections":[{"id":"slug","emoji":"emoji","title":"ad","summary":"3-4 cümle","headline":"1 cümle","stories":[{"title":"başlık","brief":"1 cümle"}],"outlook":"1 cümle"}]}`;

  // B: Sayısal veriler — kısa, hızlı
  const pB = `Bu haber analizinden JSON üret. SADECE JSON. { ile başla } ile bit.

${ctx.slice(0, 2000)}

{"numberofDay":{"figure":"rakam — boşsa tahmini üret","context":"1 cümle Türkçe"},"wordOfDay":{"word":"Türkçe kavram","definition":"1-2 cümle Türkçe"},"markets":{"bist100":"değer ya da null","usdTry":"değer ya da null","eurTry":"değer ya da null","note":"yaklaşık"},"weather":{"city":"İstanbul","condition":"durum","tempRange":"min-max°C","note":"kısa not"}}`;

  // C: Dünya haberleri + tarih + alıntı — orta boy
  const pC = `Bu haber analizinden JSON üret. SADECE JSON. { ile başla } ile bit.

${ctx.slice(0, 3000)}

{"worldHeadlines":[{"title":"başlık","region":"ülke/bölge","brief":"1 cümle"}],"todayInHistory":{"year":"yıl","event":"olay","significance":"1 cümle"},"quoteOfDay":{"text":"alıntı","author":"kişi","context":"bağlam"}}`;

  // D: Sadece editör notu — çok küçük, 300 token
  const pD = `Bu haber analizine dayanarak JSON üret. SADECE JSON. { ile başla } ile bit.

${ctx.slice(0, 1500)}

{"editorNote":"2-3 cümle samimi özgün editör notu. Klişe değil."}`;

  const [dA, dB, dC, dD] = await Promise.all([
    safeJSON(pA, { model: GEMINI_MODELS.FLASH, temperature: 0.15, maxTokens: 5000 }, "Ana içerik"),
    safeJSON(pB, { model: GEMINI_MODELS.FLASH, temperature: 0.15, maxTokens: 1200 }, "Sayısal"),
    safeJSON(pC, { model: GEMINI_MODELS.FLASH, temperature: 0.15, maxTokens: 1800 }, "Dünya/Tarih"),
    safeJSON(pD, { model: GEMINI_MODELS.FLASH, temperature: 0.20, maxTokens: 350  }, "Editör notu"),
  ]);

  // Ana içerik (dA) olmadan devam etme
  if (!dA) return { error: "main_content_failed" };

  const result = {
    ...dA,
    ...(dB || {}),
    ...(dC || {}),
    ...(dD || {}),
    date:         today,
    issueNumber:  calcIssueNumber(),
    articleCount: articles.length,
    generatedAt:  new Date().toISOString(),
  };

  try {
    await redis.set(todayKey(), result, { ex: ttlUntilMidnight() });
    console.log(`[dailySummary] ✓ Cache'e yazıldı — Sayı #${result.issueNumber}, ${articles.length} haber`);
  } catch (err) {
    console.error("[dailySummary] Redis SET:", err.message);
  }

  return { ...result, fromCache: false };
}