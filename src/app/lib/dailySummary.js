import { Redis } from "@upstash/redis";
import {
  GEMINI_MODELS,
  generateJSON,
  generateWithGrounding,
  parseGeminiJSON,
} from "./gemini";
import { getNewsFeed } from "./newsSource";
import { fetchMarketData, fetchWeatherData } from "./realTimeData";
import { supabaseAdmin } from "./supabase";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const KEY_PREFIX = "daily-summary-v6";
const FIRST_ISSUE_DATE = new Date("2026-03-01");

function todayKey() {
  return `${KEY_PREFIX}:${new Date().toISOString().slice(0, 10)}`;
}
function todayFormatted() {
  return new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function ttlUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 1000) + 3600;
}
function calcIssueNumber() {
  return Math.floor((new Date() - FIRST_ISSUE_DATE) / 86_400_000) + 1;
}

async function safeJSON(prompt, opts, label) {
  try {
    return await generateJSON(prompt, { ...opts, label });
  } catch (err) {
    console.error(`[dailySummary] "${label}" basarisiz:`, err.message);
    return null;
  }
}

async function safeGroundingJSON(prompt, opts, fallbackShape, label) {
  try {
    const text = await generateWithGrounding(prompt, opts);
    if (!text) return null;
    try {
      return parseGeminiJSON(text, label);
    } catch {
      // Grounding JSON disinda metin ekledi — JSON cikarma fallback
      return await safeJSON(
        `Asagidaki metinden JSON cikar. YALNIZCA JSON. { ile basla } ile bit.\n\n${text.slice(0, 2000)}\n\n${fallbackShape}`,
        { model: GEMINI_MODELS.FLASH_LITE, temperature: 0.1, maxTokens: 600 },
        `${label} - json-extract`,
      );
    }
  } catch (err) {
    console.error(
      `[dailySummary] Grounding "${label}" basarisiz:`,
      err.message,
    );
    return null;
  }
}

// ── Haber listesi ─────────────────────────────────────────────────────────
function buildArticleList(articles) {
  return articles
    .map((a, i) =>
      [
        `[${i + 1}] ${a.source_name || "?"}`,
        a.title,
        a.description?.slice(0, 120),
        a.category?.join("/"),
      ]
        .filter(Boolean)
        .join(" | "),
    )
    .join("\n");
}

// ═══════════════════════════════════════════════════════════
// BOLUM 1: HABER ANALİZİ
// ═══════════════════════════════════════════════════════════
async function fetchNewsAnalysis(articleList, today) {
  const prompt = `Sen Turkiye'nin en deneyimli haber editorusun. Bugun ${today}.

HABERLER:
${articleList}

Yukaridaki haberleri Google Search ile dogrula ve genislet. Asagidaki JSON sablonunu EKSIKSIZ doldur.
ZORUNLU: Yanit YALNIZCA gecerli JSON. { ile basla } ile bit.

{"headline":"tek carpici cumle manset","subheadline":"ikinci gelisme 1 cumle","dayMood":"tense|hopeful|turbulent|calm|critical|uncertain|positive","intro":"4-5 cumle analitik paragraf","bigPicture":"2-3 cumle ortak tema","mustRead":[{"rank":1,"title":"haber basligi","why":"2 cumle neden onemli","impact":"critical|high","category":"politics|business|world|health|technology|other","imageUrl":"url veya null"},{"rank":2,"title":"...","why":"...","impact":"high","category":"...","imageUrl":null},{"rank":3,"title":"...","why":"...","impact":"high","category":"...","imageUrl":null},{"rank":4,"title":"...","why":"...","impact":"high","category":"...","imageUrl":null},{"rank":5,"title":"...","why":"...","impact":"high","category":"...","imageUrl":null}],"sections":[{"id":"politika","emoji":"🏛","title":"Politika","summary":"3-4 cumle","headline":"1 cumle manset","stories":[{"title":"...","brief":"1 cumle"}],"outlook":"1 cumle ongozu"},{"id":"ekonomi","emoji":"📈","title":"Ekonomi","summary":"3-4 cumle","headline":"1 cumle","stories":[{"title":"...","brief":"1 cumle"}],"outlook":"1 cumle"},{"id":"dunya","emoji":"🌍","title":"Dunya","summary":"3-4 cumle","headline":"1 cumle","stories":[{"title":"...","brief":"1 cumle"}],"outlook":"1 cumle"},{"id":"teknoloji","emoji":"💻","title":"Teknoloji","summary":"3-4 cumle","headline":"1 cumle","stories":[{"title":"...","brief":"1 cumle"}],"outlook":"1 cumle"},{"id":"spor","emoji":"⚽","title":"Spor","summary":"3-4 cumle","headline":"1 cumle","stories":[{"title":"...","brief":"1 cumle"}],"outlook":"1 cumle"}],"editorNote":"2-3 cumle samimi ozgun editor notu klise degil","todayInHistory":{"year":"yil","event":"olay aciklamasi","significance":"1 cumle neden onemli"},"quoteOfDay":{"text":"alinti metni","author":"kisi adi","context":"baglam 1 cumle"},"wordOfDay":{"word":"Turkce kavram","definition":"1-2 cumle Turkce aciklama"},"numberOfDay":{"figure":"dikkat cekici bir sayi","context":"1 cumle Turkce baglam"}}`;

  return await safeGroundingJSON(
    prompt,
    { model: GEMINI_MODELS.FLASH, temperature: 0.3, maxTokens: 8000 },
    '{"headline":"—","subheadline":"—","dayMood":"calm","intro":"—","bigPicture":"—","mustRead":[],"sections":[],"editorNote":"—","todayInHistory":{"year":"—","event":"—","significance":"—"},"quoteOfDay":{"text":"—","author":"—","context":"—"},"wordOfDay":{"word":"—","definition":"—"},"numberOfDay":{"figure":"—","context":"—"}}',
    "Haber analizi",
  );
}

// ═══════════════════════════════════════════════════════════
// BOLUM 2: DUNYA HABERLERİ — ayri grounding
// (Piyasa ve hava verileri artik realTimeData.js'den geliyor)
// ═══════════════════════════════════════════════════════════
async function fetchWorldNews(today) {
  const prompt = `Bugun ${today} dunyadan en onemli 3 haber. Google Search ile guncel ara.

ZORUNLU: Yanit YALNIZCA gecerli JSON. { ile basla } ile bit.

{"worldHeadlines":[{"title":"haber basligi","region":"ulke veya bolge","brief":"1 cumle ozet"},{"title":"...","region":"...","brief":"..."},{"title":"...","region":"...","brief":"..."}]}`;

  return await safeGroundingJSON(
    prompt,
    { model: GEMINI_MODELS.FLASH, temperature: 0.2, maxTokens: 500 },
    '{"worldHeadlines":[{"title":"Dunya verileri alinamadi","region":"—","brief":"—"}]}',
    "Dunya haberleri",
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════
export async function getDailySummary() {
  const todayStr = new Date().toISOString().slice(0, 10);
  try {
    const cached = await redis.get(todayKey());
    if (cached) return { ...cached, fromCache: true };
  } catch (err) {
    console.error("[dailySummary] Redis GET:", err.message);
  }

  // Fallback to Supabase if not in Redis
  try {
    const { data: dbData } = await supabaseAdmin
      .from("daily_digests")
      .select("*")
      .eq("date", todayStr)
      .single();
    if (dbData && dbData.top_stories) {
      return { ...dbData.top_stories, fromCache: true, source: "supabase" };
    }
  } catch (err) {
    console.error(
      "[dailySummary] Supabase GET today fallback error:",
      err.message,
    );
  }

  return null;
}

export async function getSummaryByDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr > today) return null;
  try {
    const cached = await redis.get(`${KEY_PREFIX}:${dateStr}`);
    if (cached) return { ...cached, fromCache: true };
  } catch (err) {
    console.error("[dailySummary] Redis GET by date:", err.message);
  }

  // Fallback to Supabase for historical dates no longer in Redis
  try {
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from("daily_digests")
      .select("*")
      .eq("date", dateStr)
      .single();
    if (dbData && dbData.top_stories) {
      return { ...dbData.top_stories, fromCache: true, source: "supabase" };
    }
  } catch (err) {
    console.error(
      "[dailySummary] Supabase GET by date fallback error:",
      err.message,
    );
  }

  return null;
}

export async function generateDailySummary() {
  const feedData = await getNewsFeed({ page: 1, pageSize: 30 });
  const articles = (feedData.results || []).slice(0, 25);
  if (!articles.length) return { error: "no_articles" };

  const today = todayFormatted();
  const articleList = buildArticleList(articles);

  console.log(`[dailySummary] ${articles.length} haber, ${today}`);

  // Paralel: 2 Gemini grounding (haber analizi + dunya) + 2 gercek API (piyasa + hava)
  const [newsData, worldNews, markets, weather] = await Promise.all([
    fetchNewsAnalysis(articleList, today),
    fetchWorldNews(today),
    fetchMarketData(), // Yahoo Finance — AI yok
    fetchWeatherData(), // Open-Meteo — AI yok
  ]);

  if (!newsData) return { error: "main_content_failed" };

  // Hic biri null kalmiyor — her bolum kendi fallback'ine sahip
  const result = {
    headline: newsData.headline || "—",
    subheadline: newsData.subheadline || "—",
    dayMood: newsData.dayMood || "calm",
    intro: newsData.intro || "—",
    bigPicture: newsData.bigPicture || "—",
    mustRead: newsData.mustRead || [],
    sections: newsData.sections || [],
    editorNote: newsData.editorNote || "—",
    todayInHistory: newsData.todayInHistory || {
      year: "—",
      event: "—",
      significance: "—",
    },
    quoteOfDay: newsData.quoteOfDay || { text: "—", author: "—", context: "—" },
    wordOfDay: newsData.wordOfDay || { word: "—", definition: "—" },
    numberOfDay: newsData.numberOfDay || { figure: "—", context: "—" },

    markets: markets || {
      bist100: "—",
      bist100Change: "—",
      usdTry: "—",
      eurTry: "—",
      goldGram: "—",
      note: "veri alinamadi",
    },
    weather: weather || {
      city: "Istanbul",
      condition: "—",
      tempHigh: "—",
      tempLow: "—",
      humidity: "—",
      note: "veri alinamadi",
    },
    worldHeadlines: worldNews?.worldHeadlines || [],

    date: today,
    issueNumber: calcIssueNumber(),
    articleCount: articles.length,
    generatedAt: new Date().toISOString(),
  };

  try {
    await redis.set(todayKey(), result, { ex: ttlUntilMidnight() });
    console.log(`[dailySummary] Cache'e yazildi — Sayi #${result.issueNumber}`);
  } catch (err) {
    console.error("[dailySummary] Redis SET:", err.message);
  }

  // ── Supabase upsert — daily_digests tablosuna yaz ──
  const todayStr = new Date().toISOString().slice(0, 10);
  console.log("[dailySummary] Inserting digest:", {
    date: todayStr,
    model_used: GEMINI_MODELS.PRIMARY_ANALYSIS,
  });

  const { data: upsertData, error: upsertError } = await supabaseAdmin
    .from("daily_digests")
    .upsert(
      {
        date: todayStr,
        top_stories: result,
        market_data: result.markets ?? null,
        generated_at: new Date().toISOString(),
        model_used: GEMINI_MODELS.PRIMARY_ANALYSIS,
      },
      { onConflict: "date" },
    );

  if (upsertError) {
    console.error("[dailySummary] Supabase upsert error:", upsertError);
    // Non-fatal — Redis cache already written, don't break the response
  } else {
    console.log("[dailySummary] Supabase upsert OK:", { date: todayStr });
  }

  return { ...result, fromCache: false };
}
