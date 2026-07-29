/**
 * Generates a URL-safe slug from an article title + date.
 * Turkish chars converted, special chars stripped.
 */
export function generateArticleSlug(title, publishedAt) {
  if (!title) return null;

  let date;
  try {
    const d = publishedAt ? new Date(publishedAt) : new Date();
    if (isNaN(d.getTime())) {
      date = new Date().toISOString().split("T")[0];
    } else {
      date = d.toISOString().split("T")[0];
    }
  } catch {
    date = new Date().toISOString().split("T")[0];
  }

  const slug = title
    .toLowerCase()
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  if (!slug) return `article-${date}`;
  return `${slug}-${date}`;
}

function decodeBasicEntities(str) {
  if (!str || typeof str !== "string") return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** TR / legacy kategori slug → kanonik İngilizce slug */
const CATEGORY_ALIASES = {
  dunya: "world",
  dünya: "world",
  world: "world",
  ekonomi: "business",
  business: "business",
  gundem: "politics",
  gündem: "politics",
  domestic: "politics",
  politics: "politics",
  teknoloji: "technology",
  technology: "technology",
  spor: "sports",
  sports: "sports",
  saglik: "health",
  sağlık: "health",
  health: "health",
  bilim: "science",
  science: "science",
  kultur: "culture",
  kültür: "culture",
  "kultur-sanat": "culture",
  culture: "culture",
  magazin: "entertainment",
  entertainment: "entertainment",
  yasam: "lifestyle",
  yaşam: "lifestyle",
  lifestyle: "lifestyle",
  defense: "defense",
  savunma: "defense",
};

/**
 * Kategoriyi her zaman benzersiz İngilizce slug dizisine çevirir.
 * UI filtreleri (HomeNewsFeed) ve RSS etiketleri aynı sözlüğü kullanır.
 */
export function normalizeCategories(category, fallback = "politics") {
  const raw = Array.isArray(category)
    ? category
    : category
      ? [category]
      : [fallback];

  const mapped = raw
    .map((c) => {
      if (typeof c !== "string") return null;
      const key = c.trim().toLowerCase();
      return CATEGORY_ALIASES[key] || key.replace(/\s+/g, "-") || null;
    })
    .filter(Boolean);

  return [...new Set(mapped.length ? mapped : [fallback])];
}

/**
 * Ensures an article object always has a slug and all required fields.
 * Call this wherever articles are fetched/transformed.
 */
export function normalizeArticle(article) {
  if (!article || typeof article !== "object") return article;

  const publishedAt =
    article.publishedAt ||
    article.published_at ||
    article.pubDate ||
    new Date().toISOString();

  const rawLink = article.link || article.url || article.source_url || null;
  const link = rawLink ? decodeBasicEntities(rawLink) : null;

  const title =
    article.title || article.turkishTitle || article.headline || "Başlık yok";

  const slug =
    article.slug || generateArticleSlug(title, publishedAt) || null;

  const articleId =
    article.article_id ||
    article.id ||
    (slug ? `slug:${slug}` : null);

  const category = normalizeCategories(
    article.category,
    article.isInternational ? "world" : "politics",
  );

  return {
    ...article,
    article_id: articleId,
    slug,
    title,
    summary: article.summary || article.description || "",
    description: article.description || article.summary || "",
    source:
      article.sourceName || article.source_name || article.source || "Kaynak",
    source_name:
      article.source_name || article.sourceName || article.source || "Kaynak",
    category,
    publishedAt,
    pubDate: article.pubDate || publishedAt,
    link,
    url: link,
    imageUrl:
      article.imageUrl ||
      article.image ||
      article.thumbnail ||
      article.image_url ||
      null,
    image_url:
      article.image_url ||
      article.imageUrl ||
      article.image ||
      article.thumbnail ||
      null,
  };
}
