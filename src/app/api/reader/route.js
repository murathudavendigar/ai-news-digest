import { GEMINI_MODELS } from "@/app/lib/gemini";
import { Redis } from "@upstash/redis";
import * as cheerio from "cheerio";
import { NextResponse } from "next/server";

export const maxDuration = 30;

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const CACHE_TTL = 6 * 60 * 60; // 6 hours
const MAX_BODY_CHARS = 8000;

const ARTICLE_SELECTORS = [
  "article",
  ".article-content",
  ".article-body",
  ".news-detail",
  ".haber-detay",
  ".detay-icerik",
  ".icerik",
  '[class*="article-body"]',
  '[class*="story-body"]',
  '[class*="content-body"]',
  ".post-content",
  ".entry-content",
  "main",
  '[role="main"]',
];

const STRIP_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "nav",
  "header",
  "footer",
  "aside",
  "form",
  ".ad",
  ".ads",
  ".reklam",
  ".advertisement",
  '[class*="social"]',
  '[class*="share"]',
  '[class*="comment"]',
  '[class*="related"]',
  '[class*="sidebar"]',
  '[class*="newsletter"]',
  '[class*="popup"]',
  '[class*="modal"]',
  '[class*="cookie"]',
  '[class*="banner"]',
  ".breadcrumb",
  ".pagination",
  "figure figcaption",
];

function extractSource(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname.split(".")[0].charAt(0).toUpperCase() + hostname.split(".")[0].slice(1);
  } catch {
    return "Bilinmiyor";
  }
}

function cleanText(html$) {
  // Strip unwanted elements
  STRIP_SELECTORS.forEach((sel) => {
    try {
      html$(sel).remove();
    } catch {}
  });

  // Get text from paragraphs and headings
  const blocks = [];
  html$("p, h2, h3, h4, blockquote").each((_, el) => {
    const text = html$(el).text().trim();
    if (text.length > 10) {
      const tag = html$(el).prop("tagName")?.toLowerCase();
      if (tag === "h2" || tag === "h3" || tag === "h4") {
        blocks.push(`\n## ${text}\n`);
      } else if (tag === "blockquote") {
        blocks.push(`> ${text}`);
      } else {
        blocks.push(text);
      }
    }
  });

  return blocks.join("\n\n").trim();
}

async function scrapeArticle(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  // Extract metadata
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

  const mainImage =
    $('meta[property="og:image"]').attr("content") || null;

  // Extract body text — try selectors in order
  let bodyText = "";
  for (const selector of ARTICLE_SELECTORS) {
    const el = $(selector).first();
    if (el.length) {
      const clone = cheerio.load(el.html() || "");
      bodyText = cleanText(clone);
      if (bodyText.length >= 200) break;
    }
  }

  // Fallback: try full body
  if (bodyText.length < 200) {
    const clone = cheerio.load($("body").html() || "");
    bodyText = cleanText(clone);
  }

  // Limit length
  if (bodyText.length > MAX_BODY_CHARS) {
    bodyText = bodyText.slice(0, MAX_BODY_CHARS).trimEnd() + "\n\n… devamını kaynakta oku";
  }

  return { title, author, publishedAt, mainImage, bodyText };
}

async function generateSummary(bodyText) {
  const prompt = `Bu haber metnini Türkçe olarak özetle.

3-4 cümle, akıcı ve doğal
Madde işareti kullanma
Sadece özeti yaz, başka hiçbir şey ekleme

Metin:
${bodyText.slice(0, 3000)}`;

  const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
  const key = process.env.GEMINI_API_KEY;
  if (!key) return "Özet oluşturulamadı.";

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
          generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = (data.candidates?.[0]?.content?.parts || [])
        .map((p) => p.text || "")
        .join("")
        .trim();
      if (text.length > 20) return text;
    } catch {
      continue;
    }
  }

  return "Özet oluşturulamadı.";
}

export async function GET(request) {
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
    // Check Redis cache
    const cacheKey = `reader:${url}`;
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true });
    }

    // Scrape
    const { title, author, publishedAt, mainImage, bodyText } =
      await scrapeArticle(url);

    const scrapingFailed = !bodyText || bodyText.length < 200;

    // Generate AI summary (even if scraping partially worked)
    const textForSummary = scrapingFailed
      ? title || url
      : bodyText;
    const summary = await generateSummary(textForSummary);

    const result = {
      title: title || null,
      author: author || null,
      publishedAt: publishedAt || null,
      mainImage: mainImage || null,
      summary,
      bodyText: scrapingFailed ? null : bodyText,
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
