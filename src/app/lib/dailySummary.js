import { Redis } from "@upstash/redis";
import { generateCompletion, GROQ_MODELS } from "./groq";
import { getLatest } from "./news";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

// Bugünün tarihini key olarak kullan — her gün otomatik yeni key
function todayKey() {
  return `daily-summary:${new Date().toISOString().slice(0, 10)}`; // "daily-summary:2026-02-27"
}

export async function getDailySummary() {
  const key = todayKey();

  // Cache'de var mı?
  try {
    const cached = await redis.get(key);
    if (cached) return { ...cached, fromCache: true };
  } catch {}

  return null; // Henüz üretilmemiş — cron tetikleyecek
}

export async function generateDailySummary() {
  const key = todayKey();

  // Günün haberlerini çek
  const newsData = await getLatest("tr");
  const articles = (newsData.results || []).slice(0, 15); // İlk 15 haber yeterli

  if (articles.length === 0) {
    return { error: "no_articles" };
  }

  // Haberleri prompt için formatla
  const articleList = articles
    .map(
      (a, i) =>
        `${i + 1}. [${a.source_name}] ${a.title}${a.description ? ` — ${a.description}` : ""}`,
    )
    .join("\n");

  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const systemPrompt = `Sen Türkiye'nin en iyi haber editörüsün. Her sabah okuyuculara o günün haberlerini akıcı, bağlamsal ve ilgi çekici bir şekilde özetliyorsun. Cevabın tamamen Türkçe olmalı.

OUTPUT — sadece bu JSON'u döndür, başka hiçbir şey ekleme (markdown fence yok):
{
  "headline": "Bugünü tek cümlede özetleyen çarpıcı bir başlık.",
  "intro": "2-3 cümle. Bugünün en önemli 2-3 gelişmesini bağlantılı biçimde anlat. Gazete manşeti havasında yaz.",
  "sections": [
    {
      "emoji": "tek emoji",
      "title": "Konu başlığı (örn: Siyaset, Ekonomi, Dünya)",
      "summary": "Bu konudaki 2-3 haberi 2-3 cümlede sentezle. Spesifik ol."
    }
  ],
  "closingNote": "Bugüne dair 1 cümlelik genel yorum veya bağlam.",
  "topStories": ["Başlık 1", "Başlık 2", "Başlık 3"]
}

"sections" 3-5 arası olmalı. "topStories" en önemli 3 haberin başlığı.`;

  const userPrompt = `Tarih: ${today}

Bugünün haberleri:
${articleList}

Bu haberleri Türk okuyucular için günlük özet formatında sentezle.`;

  const raw = await generateCompletion(userPrompt, {
    model: GROQ_MODELS.BALANCED,
    temperature: 0.4,
    maxTokens: 2048,
    systemPrompt,
  });

  const cleaned = raw
    .replace(/^```(?:json)?/m, "")
    .replace(/```$/m, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[dailySummary] JSON parse error:", cleaned.slice(0, 300));
    return { error: "parse_error" };
  }

  const result = {
    ...parsed,
    date: today,
    generatedAt: new Date().toISOString(),
    articleCount: articles.length,
  };

  // Gece yarısına kadar cache'le (TTL = kalan saniye + 1 saat buffer)
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const ttl = Math.floor((midnight - now) / 1000) + 3600;

  try {
    await redis.set(key, result, { ex: ttl });
  } catch (err) {
    console.error("[dailySummary] Cache SET error:", err);
  }

  return { ...result, fromCache: false };
}
