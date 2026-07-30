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

const CACHE_TTL_OK = 6 * 60 * 60; // başarı: 6 saat
const CACHE_TTL_FAIL = 10 * 60; // başarısızlık: 10 dk (geçici 403'ler için)
const CACHE_VER = "v4"; // bump: jina/amp fallback + fail TTL
const MAX_BODY_CHARS = 8000;
const MIN_BODY_CHARS = 200;
const FETCH_TIMEOUT_MS = 12000;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

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
  ".detail-content",
  ".news-detail__body",
  ".content-body",
  "#content-body",
  ".story__content",
  ".article__body",
  ".post-body",
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

function isPrivateHost(hostname) {
  const h = hostname.toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h === "0.0.0.0"
  ) {
    return true;
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const [a, b] = h.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

function assertSafePublicUrl(raw) {
  const u = new URL(raw);
  if (!["http:", "https:"].includes(u.protocol)) {
    throw new Error("Sadece http/https URL desteklenir");
  }
  if (isPrivateHost(u.hostname)) {
    throw new Error("Özel ağ adreslerine erişim engellendi");
  }
  return u;
}

function capBody(bodyText) {
  let text = scrubPromoNoise(bodyText || "");
  if (text.length > MAX_BODY_CHARS) {
    text =
      text.slice(0, MAX_BODY_CHARS).trimEnd() + "\n\n… devamını kaynakta oku";
  }
  return text;
}

function isGoodBody(bodyText) {
  return Boolean(bodyText && bodyText.replace(/\s+/g, " ").trim().length >= MIN_BODY_CHARS);
}

function extractFromHtml(html) {
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

  return {
    title,
    author,
    publishedAt,
    mainImage,
    bodyText: capBody(bodyText),
  };
}

async function fetchHtml(url, { timeout = FETCH_TIMEOUT_MS } = {}) {
  const res = await fetch(url, {
    headers: BROWSER_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function scrapeDirect(url) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const html = await fetchHtml(url, {
        timeout: attempt === 0 ? FETCH_TIMEOUT_MS : 15000,
      });
      return { ...extractFromHtml(html), method: "direct" };
    } catch (err) {
      lastErr = err;
      // 403/401'de retry anlamsız; timeout/5xx için bir kez daha dene
      const msg = String(err?.message || "");
      if (/HTTP 40[13]/.test(msg) || /HTTP 429/.test(msg)) break;
    }
  }
  throw lastErr || new Error("Doğrudan scrape başarısız");
}

function ampCandidates(url) {
  try {
    const u = new URL(url);
    const out = [];
    // /amp ve /amp/ sonekleri
    if (!u.pathname.includes("/amp")) {
      out.push(`${u.origin}${u.pathname.replace(/\/?$/, "")}/amp`);
      out.push(`${u.origin}${u.pathname.replace(/\/?$/, "")}/amp/`);
    }
    // ?outputType=amp (AA vb.)
    const q = new URL(url);
    q.searchParams.set("outputType", "amp");
    out.push(q.toString());
    return [...new Set(out)];
  } catch {
    return [];
  }
}

async function scrapeAmp(url) {
  for (const ampUrl of ampCandidates(url)) {
    try {
      const html = await fetchHtml(ampUrl, { timeout: 10000 });
      const parsed = extractFromHtml(html);
      if (isGoodBody(parsed.bodyText)) {
        return { ...parsed, method: "amp" };
      }
    } catch {
      // sonraki aday
    }
  }
  throw new Error("AMP scrape başarısız");
}

/**
 * Jina Reader — bot korumalı siteler için metin çıkarımı.
 * Ücretsiz, API key gerekmez. https://r.jina.ai/{url}
 */
async function scrapeJina(url) {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const res = await fetch(jinaUrl, {
    headers: {
      Accept: "text/plain",
      "User-Agent": "HaberAI/1.0 (+https://haberai.muratoncu.com)",
      "X-Return-Format": "text",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Jina HTTP ${res.status}`);

  const text = (await res.text()).trim();
  // Jina bazen Title:/URL: başlıkları ekler — gövdeyi ayır
  let body = text;
  const markers = ["Markdown Content:", "Markdown Content：", "\n\n"];
  for (const m of markers) {
    const idx = body.indexOf(m);
    if (idx !== -1 && idx < 800) {
      body = body.slice(idx + m.length).trim();
      break;
    }
  }

  // Title satırını yakala
  let title = null;
  const titleMatch = text.match(/^Title:\s*(.+)$/im);
  if (titleMatch) title = titleMatch[1].trim();

  body = capBody(body.replace(/^#{1,6}\s+/gm, "").trim());
  if (!isGoodBody(body)) throw new Error("Jina metin çok kısa");

  return {
    title,
    author: null,
    publishedAt: null,
    mainImage: null,
    bodyText: body,
    method: "jina",
  };
}

/**
 * Zincir: direct → AMP → Jina.
 * hintText: RSS description/content (istemci gönderirse)
 */
async function scrapeArticle(url, { hintText } = {}) {
  const errors = [];
  let best = null;

  const tryMethod = async (name, fn) => {
    try {
      const result = await fn();
      if (isGoodBody(result.bodyText)) return result;
      if (
        result.bodyText &&
        (!best || result.bodyText.length > (best.bodyText?.length || 0))
      ) {
        best = result;
      }
      errors.push(`${name}: kısa gövde (${result.bodyText?.length || 0})`);
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
    return null;
  };

  let result =
    (await tryMethod("direct", () => scrapeDirect(url))) ||
    (await tryMethod("amp", () => scrapeAmp(url))) ||
    (await tryMethod("jina", () => scrapeJina(url)));

  if (!result && best && isGoodBody(best.bodyText)) result = best;

  // RSS/hint yedek — scrape tamamen başarısızsa
  if (!result && hintText && hintText.trim().length >= MIN_BODY_CHARS) {
    result = {
      title: null,
      author: null,
      publishedAt: null,
      mainImage: null,
      bodyText: capBody(hintText),
      method: "rss-hint",
    };
  }

  if (!result) {
    const err = new Error(errors.join(" | ") || "Scrape başarısız");
    err.partial = best;
    throw err;
  }

  return result;
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
            bullets: Array.isArray(parsed.bullets)
              ? parsed.bullets.slice(0, 4)
              : [],
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
  const hintText = (searchParams.get("hint") || "").slice(0, 6000);

  if (!url) {
    return NextResponse.json(
      { error: "url parametresi gerekli", scrapingFailed: true },
      { status: 400 },
    );
  }

  try {
    assertSafePublicUrl(url);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Geçersiz URL", scrapingFailed: true },
      { status: 400 },
    );
  }

  const cacheKey = `reader:${CACHE_VER}:${Buffer.from(url).toString("base64").slice(0, 100)}`;

  try {
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true });
    }

    let title = null;
    let author = null;
    let publishedAt = null;
    let mainImage = null;
    let bodyText = "";
    let method = null;
    let scrapingFailed = false;

    try {
      const scraped = await scrapeArticle(url, { hintText });
      title = scraped.title;
      author = scraped.author;
      publishedAt = scraped.publishedAt;
      mainImage = scraped.mainImage;
      bodyText = scraped.bodyText || "";
      method = scraped.method;
      scrapingFailed = !isGoodBody(bodyText);
    } catch (err) {
      console.warn("[reader] scrape zinciri:", err.message);
      // Kısmi sonuç varsa kullan
      if (err.partial?.bodyText) {
        bodyText = err.partial.bodyText;
        title = err.partial.title;
        method = err.partial.method || "partial";
      }
      // Hint ile kurtar
      if (!isGoodBody(bodyText) && hintText.trim().length >= MIN_BODY_CHARS) {
        bodyText = capBody(hintText);
        method = "rss-hint";
      }
      scrapingFailed = !isGoodBody(bodyText);
    }

    const textForSummary = scrapingFailed
      ? [title, hintText, url].filter(Boolean).join("\n\n") || url
      : bodyText;
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
      scrapeMethod: method,
    };

    await redis
      .set(cacheKey, result, {
        ex: scrapingFailed ? CACHE_TTL_FAIL : CACHE_TTL_OK,
      })
      .catch(() => {});

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
      { status: 200 },
    );
  }
}
