import { devLog, devWarn } from "./devLog";
import { generateJSON, GROQ_MODELS } from "./groq";
import { INTERNATIONAL_SOURCES } from "./internationalSources";
import { normalizeArticle } from "./newsUtils";
import { redis } from "./redis";

const CACHE_TTL = 1800; // 30 minutes — international news refreshes less often
const CACHE_KEY = "intl_news:v1";

function decodeHtmlEntities(str) {
  if (!str) return "";
  return String(str)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Fetch + parse a single RSS feed
 * Returns array of raw items: { title, url, description, publishedAt, sourceId, sourceName, category, language }
 */
async function fetchRSSFeed(source) {
  const res = await fetch(source.rssUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; HaberAI/1.0; RSS Reader)",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 1800 }, // Next.js fetch cache
  });

  if (!res.ok)
    throw new Error(`RSS fetch failed: ${source.id} → ${res.status}`);

  const xml = await res.text();

  // Simple XML parser — no library needed for RSS
  // Extract <item> blocks
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const title =
      item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
      item.match(/<title>(.*?)<\/title>/)?.[1] ||
      "";

    const url = decodeHtmlEntities(
      item.match(/<link>(.*?)<\/link>/)?.[1] ||
        item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] ||
        "",
    ).trim();

    const description =
      item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
      item.match(/<description>(.*?)<\/description>/)?.[1] ||
      "";

    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

    if (title && url) {
      items.push({
        title: title.trim(),
        url: url.trim(),
        description: description
          .replace(/<[^>]+>/g, "")
          .trim()
          .slice(0, 300),
        publishedAt: pubDate
          ? new Date(pubDate).toISOString()
          : new Date().toISOString(),
        sourceId: source.id,
        sourceName: source.name,
        category: source.category,
        language: source.language,
        noTranslation: source.noTranslation || false,
      });
    }
  }

  return items.slice(0, 8); // max 8 per source
}

/**
 * Translate + summarize a batch of English articles using Gemini
 * Batches up to 5 articles per call to minimize API usage
 */
async function translateAndSummarize(articles) {
  if (!articles.length) return [];

  // Process in batches of 5
  const results = [];
  const batchSize = 5;

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);

    try {
      const prompt = `
Aşağıdaki ${batch.length} İngilizce haber başlığı ve açıklamasını Türkçeye çevir ve özetle.

Her haber için:
- Türkçe başlık: doğal, akıcı, haber dili
- Özet: 2 cümle, Türkçe, bilgilendirici
- Kategori tahmini: politics/business/world/technology/sports/health/culture/science

Haberler:
${batch
  .map(
    (a, idx) => `
[${idx + 1}]
Başlık: ${a.title}
Açıklama: ${a.description}
Kaynak: ${a.sourceName}
`,
  )
  .join("\n")}

Yanıt YALNIZCA JSON array:
[
  {
    "index": 1,
    "turkishTitle": "Türkçe başlık",
    "summary": "2 cümle Türkçe özet.",
    "category": "world"
  }
]
`;

      const translated = await generateJSON(prompt, {
        model: GROQ_MODELS.BALANCED, // Use Llama 3.3 70B via Groq/SambaNova
        temperature: 0.1,
        label: "intl-translation",
      });

      // Merge translations back with original articles
      if (Array.isArray(translated)) {
        for (const t of translated) {
          const original = batch[t.index - 1];
          if (original) {
            results.push({
              ...original,
              title: t.turkishTitle || original.title,
              summary: t.summary || original.description,
              category: t.category || original.category,
              isTranslated: true,
              originalTitle: original.title,
            });
          }
        }
      } else {
        throw new Error("API did not return a valid array");
      }
    } catch (err) {
      devWarn("[intl-news] Translation batch failed:", err.message);
      // On failure: add originals without translation
      batch.forEach((a) =>
        results.push({
          ...a,
          summary: a.description,
          isTranslated: false,
        }),
      );
    }

    // Small delay between batches to respect rate limits
    if (i + batchSize < articles.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}

/**
 * Main function: fetch all international news, translate, cache, return
 */
export async function fetchInternationalNews({ forceRefresh = false } = {}) {
  // Check cache first
  if (!forceRefresh) {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        devLog("[intl-news] Serving from cache");
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }
    } catch (err) {
      devWarn("[intl-news] Cache read failed:", err.message);
    }
  }

  devLog("[intl-news] Fetching fresh international news...");

  // Fetch all sources in parallel
  const fetchResults = await Promise.allSettled(
    INTERNATIONAL_SOURCES.map((source) =>
      fetchRSSFeed(source).catch((err) => {
        devWarn(`[intl-news] ${source.id} fetch failed:`, err.message);
        return [];
      }),
    ),
  );

  const allRawArticles = fetchResults
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  devLog(`[intl-news] Fetched ${allRawArticles.length} raw articles`);

  // Separate: articles needing translation vs already Turkish (DW Türkçe)
  const needsTranslation = allRawArticles.filter((a) => !a.noTranslation);
  const alreadyTurkish = allRawArticles.filter((a) => a.noTranslation);

  // Process DW Türkçe directly (no translation needed)
  const dwArticles = alreadyTurkish.map((a) => ({
    ...a,
    summary: a.description,
    isTranslated: false,
  }));

  // Translate English articles
  const translatedArticles = await translateAndSummarize(needsTranslation);

  // Combine and normalize
  const allArticles = [...translatedArticles, ...dwArticles]
    .map((article) =>
      normalizeArticle({
        ...article,
        isInternational: true,
      }),
    )
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  // Cache each article individually by slug so detail page can find it.
  // Upstash Redis objeleri otomatik serileştirir — JSON.stringify yapma.
  for (const article of allArticles) {
    if (!article.slug) continue;
    const payload = {
      ...article,
      link: article.link || article.url,
      url: article.url || article.link,
      article_id: article.article_id || `intl:${article.slug}`,
    };
    redis
      .set(`article:slug:${article.slug}`, payload, { ex: 86400 })
      .catch((err) =>
        devWarn("[intl-news] Article cache failed:", err.message),
      );
    if (payload.article_id) {
      redis
        .set(`article:${payload.article_id}`, payload, { ex: 86400 })
        .catch(() => {});
    }
  }

  // Cache full list
  try {
    await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(allArticles));
    devLog(`[intl-news] Cached ${allArticles.length} articles`);
  } catch (err) {
    devWarn("[intl-news] Cache write failed:", err.message);
  }

  return allArticles;
}
