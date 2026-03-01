import { searchNewsAPI } from "@/app/lib/newsApi";
import { Redis } from "@upstash/redis";
import { buildComparePrompt } from "./comparePrompt";
import { generateCompletion, GROQ_MODELS } from "./groq";
import { searchNews } from "./news";

const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

const CACHE_TTL = 24 * 60 * 60; // 24 saat
const MAX_TOTAL_SOURCES = 5; // Orijinal + max 4 kaynak

// ── Cache ────────────────────────────────────────────────────────────────────

async function getCached(articleId) {
  try {
    return await redis.get(`compare:${articleId}`);
  } catch {
    return null;
  }
}

async function setCache(articleId, data) {
  try {
    await redis.set(`compare:${articleId}`, data, { ex: CACHE_TTL });
  } catch (err) {
    console.error("[compareArticles] Cache SET error:", err);
  }
}

// ── Groq ile arama sorgusu üret ──────────────────────────────────────────────

async function generateSearchQuery(title, description) {
  const prompt = `Given this news article title and description, generate the single best search query (3-5 words) to find other news sources covering the SAME specific event. Return ONLY the search query, nothing else.

Title: ${title}
Description: ${description || ""}

Search query:`;

  try {
    const result = await generateCompletion(prompt, {
      model: GROQ_MODELS.FAST,
      temperature: 0.1,
      maxTokens: 30,
    });
    return result.text.replace(/["“”‘’\.]/g, "").trim();
  } catch {
    return title.split(" ").slice(0, 4).join(" ");
  }
}

// ── Hibrit arama ─────────────────────────────────────────────────────────────

async function findRelatedArticles(original, searchQuery) {
  // NewsData + NewsAPI.org'u paralel çalıştır
  const [newsDataResult, newsAPIResult] = await Promise.allSettled([
    searchNews(searchQuery),
    searchNewsAPI(searchQuery, {
      pageSize: 5,
      language: "any", // Uluslararası kaynaklar — TR haber zaten NewsData'dan geliyor
      sortBy: "relevancy",
    }),
  ]);

  const newsDataArticles =
    newsDataResult.status === "fulfilled"
      ? newsDataResult.value?.results || []
      : [];

  const newsAPIArticles =
    newsAPIResult.status === "fulfilled"
      ? newsAPIResult.value?.articles || []
      : [];

  console.log(
    `[compareArticles] NewsData: ${newsDataArticles.length}, NewsAPI: ${newsAPIArticles.length} articles found`,
  );

  // Orijinali çıkar, farklı kaynaklardan al
  const combined = [...newsDataArticles, ...newsAPIArticles].filter(
    (a) =>
      a.article_id !== original.article_id &&
      a.source_id !== original.source_id &&
      a.title &&
      a.description &&
      a.title !== "[Removed]",
  );

  // Tekrar eden başlıkları çıkar (farklı API'den aynı haber gelebilir)
  const seen = new Set();
  const deduped = combined.filter((a) => {
    // İlk 6 kelimeyi key olarak kullan
    const titleKey = a.title.split(" ").slice(0, 6).join(" ").toLowerCase();
    if (seen.has(titleKey)) return false;
    seen.add(titleKey);
    return true;
  });

  // NewsData + NewsAPI karışık olsun — önce NewsData (TR), sonra NewsAPI (uluslararası)
  const newsDataFiltered = deduped
    .filter((a) => !a._provider || a._provider !== "newsapi")
    .slice(0, 2);

  const newsAPIFiltered = deduped
    .filter((a) => a._provider === "newsapi")
    .slice(0, 2);

  return [...newsDataFiltered, ...newsAPIFiltered].slice(
    0,
    MAX_TOTAL_SOURCES - 1,
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export async function compareArticles(original, forceRefresh = false) {
  const articleId = original.article_id;

  if (!forceRefresh) {
    const cached = await getCached(articleId);
    if (cached) {
      console.log(`[compareArticles] Cache HIT for ${articleId}`);
      return { ...cached, fromCache: true };
    }
  }

  // 1. Groq ile arama sorgusu üret
  const searchQuery = await generateSearchQuery(
    original.title,
    original.description,
  );
  console.log(`[compareArticles] Search query: "${searchQuery}"`);

  // 2. Hibrit arama
  const relatedArticles = await findRelatedArticles(original, searchQuery);

  if (relatedArticles.length === 0) {
    return {
      error: "no_related",
      message: "Bu haber için farklı kaynaklardan ilgili içerik bulunamadı.",
      fromCache: false,
    };
  }

  console.log(
    `[compareArticles] Comparing ${relatedArticles.length + 1} sources:`,
    [original, ...relatedArticles].map((a) => a.source_name).join(", "),
  );

  // 3. Groq ile karşılaştırma analizi
  const { systemPrompt, userPrompt } = buildComparePrompt(
    original,
    relatedArticles,
    original.language,
  );

  const completion = await generateCompletion(userPrompt, {
    model: GROQ_MODELS.BALANCED,
    temperature: 0.3,
    maxTokens: 2048,
    systemPrompt,
  });

  const cleaned = completion.text
    .replace(/^```(?:json)?/m, "")
    .replace(/```$/m, "")
    .trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[compareArticles] JSON parse error:", cleaned);
    return {
      error: "parse_error",
      message: "Analiz oluşturulurken hata oluştu.",
      fromCache: false,
    };
  }

  const result = {
    ...parsed,
    searchQuery, // Debug için — UI'da gösterebilirsin
    sources: [original, ...relatedArticles].map((a) => ({
      source_name: a.source_name,
      source_icon: a.source_icon,
      title: a.title,
      link: a.link,
      provider: a._provider || "newsdata", // newsdata | newsapi
    })),
    generatedAt: new Date().toISOString(),
    fromCache: false,
  };

  await setCache(articleId, result);
  return result;
}
