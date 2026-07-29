import { GEMINI_MODELS } from "@/app/lib/gemini";
import {
  scrubPromoNoise,
  toCleanParagraphs,
  isJunkParagraph,
} from "@/app/lib/cleanArticleText";
import { Redis } from "@upstash/redis";
import * as cheerio from "cheerio";
import { NextResponse } from "next/server";

export const maxDuration = 30;
export const runtime = "nodejs";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const CACHE_TTL = 6 * 60 * 60; // 6 hours
const CACHE_VER = "v3"; // bump: promo scrub
const MAX_BODY_CHARS = 8000;

const ARTICLE_SELECTORS = [
  // Turkish news sites
  ".article-body",
  ".news-detail-text",
  ".haber-detay-icerik",
  ".detay-icerik",
  ".haberMetni",
  ".articleContent",
  ".news-content",
  ".icerik",
  ".article-content",
  ".haber-icerik",
  ".detay-metin",
  // International
  "article",
  '[itemprop="articleBody"]',
  ".story-body",
  ".post-content",
  ".entry-content",
  "main p",
];

const STRIP_SELECTORS = [
  "script",
  "style",
  "nav",
  "header",
  "footer",
  "aside",
  "form",
  "button",
  "noscript",
  "iframe",
  ".ad",
  ".ads",
  ".reklam",
  ".advertisement",
  ".social-share",
  ".related",
  ".newsletter",
  ".subscribe",
  '[class*="reklam"]',
  '[class*="banner"]',
  '[class*="social"]',
  '[class*="google"]',
  '[class*="follow"]',
  '[class*="newsletter"]',
  '[class*="subscribe"]',
  '[class*="paywall"]',
  '[class*="cookie"]',
  '[class*="kvkk"]',
  '[id*="google"]',
  '[id*="newsletter"]',
].join(", ");

function extractSource(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return (
      hostname.split(".")[0].charAt(0).toUpperCase() +
      hostname.split(".")[0].slice(1)
    );
  } catch {
    return "Bilinmiyor";
  }
}

async function scrapeArticle(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xhtml;q=0.9,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    null;

  const author =
    $('meta[name="author"]').attr("content") ||
    $('[class*="author"]').first().text().trim() ||
    $('[rel="author"]').first().text().trim() ||
    null;

  const publishedAt =
    $('meta[property="article:published_time"]').attr("content") ||
    $("time").first().attr("datetime") ||
    null;

  const mainImage = $('meta[property="og:image"]').attr("content") || null;

  let bodyText = "";
  for (const selector of ARTICLE_SELECTORS) {
    const el = $(selector).first();
    if (el.length && el.text().trim().length > 200) {
      el.find(STRIP_SELECTORS).remove();
      bodyText = el.text().trim();
      break;
    }
  }

  if (!bodyText || bodyText.length < 200) {
    $("script, style, nav, header, footer, aside, form, button").remove();
    $(STRIP_SELECTORS).remove();
    bodyText = $("p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length > 50 && !isJunkParagraph(t))
      .join("\n\n");
  }

  bodyText = scrubPromoNoise(bodyText);

  if (bodyText.length > MAX_BODY_CHARS) {
    bodyText =
      bodyText.slice(0, MAX_BODY_CHARS).trimEnd() +
      "\n\n… devamını kaynakta oku";
  }

  return { title, author, publishedAt, mainImage, bodyText };
}

async function generateSummary(bodyText) {
  const { withAiContract } = await import("@/app/lib/aiContract");
  const prompt = withAiContract(`Şu haber metnini analiz et ve Türkçe olarak özetle.

Yanıt YALNIZCA JSON (başka hiçbir şey yazma):
{
  "summary": "2-3 cümlelik sentez özet: ne oldu + sonuç. RSS/lead cümlesini aynen kopyalama; yeni bir bakışla yaz.",
  "whyMatters": "Tek cümle: okuyucu için neden önemli — summary ile aynı olmasın.",
  "bullets": [
    "Önemli rakam veya isim içeren ilk nokta",
    "İkinci önemli gelişme",
    "Üçüncü kritik detay"
  ]
}

Haber metni (CTA / “Google’da takip edin” gibi site gürültüsünü yok say; yalnızca haber olayını özetle):
${bodyText.slice(0, 3000)}`);

  const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return { summary: "Özet oluşturulamadı.", whyMatters: null, bullets: [] };
  }

  const models = [
    GEMINI_MODELS.HIGH_SPEED,
    GEMINI_MODELS.PRIMARY_ANALYSIS,
    GEMINI_MODELS.RELIABLE_BACKUP,
  ];

  for (const model of models) {
    try {
      const res = await fetch(`${BASE}/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 700 },
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = (data.candidates?.[0]?.content?.parts || [])
        .map((p) => p.text || "")
        .join("")
        .trim();
      if (text.length < 20) continue;

      try {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        const clean =
          start !== -1 && end > start
            ? text.slice(start, end + 1)
            : text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(clean);
        if (parsed.summary) {
          return {
            summary: parsed.summary,
            whyMatters: parsed.whyMatters || null,
            bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 4) : [],
          };
        }
      } catch {
        return { summary: text.slice(0, 500), whyMatters: null, bullets: [] };
      }
    } catch {
      continue;
    }
  }

  return { summary: "Özet oluşturulamadı.", whyMatters: null, bullets: [] };
}

function toParagraphs(bodyText) {
  return toCleanParagraphs(bodyText);
}

export async function GET(request) {
  const { checkRateLimit, clientIp } = await import("@/app/lib/rateLimit");
  const rl = await checkRateLimit(`reader:${clientIp(request)}`, {
    limit: 30,
    windowSec: 60,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Çok fazla istek", scrapingFailed: true },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "url parametresi gerekli", scrapingFailed: true },
      { status: 400 },
    );
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "Geçersiz URL", scrapingFailed: true },
      { status: 400 },
    );
  }

  try {
    // Check Redis cache (v3 = promo scrub)
    const cacheKey = `reader:${CACHE_VER}:${Buffer.from(url).toString("base64").slice(0, 100)}`;
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true });
    }

    // Scrape
    const { title, author, publishedAt, mainImage, bodyText } =
      await scrapeArticle(url);

    const scrapingFailed = !bodyText || bodyText.length < 200;

    // Generate AI summary (even if scraping partially worked)
    const textForSummary = scrapingFailed ? title || url : bodyText;
    const { summary, whyMatters, bullets } =
      await generateSummary(textForSummary);
    const paragraphs = scrapingFailed ? [] : toParagraphs(bodyText);

    const result = {
      title: title || null,
      author: author || null,
      publishedAt: publishedAt || null,
      mainImage: mainImage || null,
      summary,
      whyMatters: whyMatters || null,
      bullets,
      paragraphs,
      bodyText: scrapingFailed ? null : bodyText,
      readingMinutes: Math.max(
        1,
        Math.round((bodyText || textForSummary || "").split(/\s+/).length / 200),
      ),
      sourceUrl: url,
      sourceName: extractSource(url),
      scrapingFailed,
    };

    // Cache
    await redis.set(cacheKey, result, { ex: CACHE_TTL }).catch(() => {});

    return NextResponse.json(result);
  } catch (err) {
    console.error("[reader] Scraping error:", err.message);
    return NextResponse.json(
      {
        title: null,
        author: null,
        publishedAt: null,
        mainImage: null,
        summary: null,
        bodyText: null,
        sourceUrl: url,
        sourceName: extractSource(url),
        scrapingFailed: true,
        error: err.message,
      },
      { status: 200 }, // Return 200 so client handles gracefully
    );
  }
}
