/**
 * Generates a URL-safe slug from an article title + date.
 * Turkish chars converted, special chars stripped.
 */
export function generateArticleSlug(title, publishedAt) {
  if (!title) return null;

  let date;
  try {
    const d = publishedAt ? new Date(publishedAt) : new Date();
    // Check if date is valid
    if (isNaN(d.getTime())) {
      date = new Date().toISOString().split("T")[0];
    } else {
      date = d.toISOString().split("T")[0];
    }
  } catch (err) {
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

/**
 * Ensures an article object always has a slug and all required fields.
 * Call this wherever articles are fetched/transformed.
 */
export function normalizeArticle(article) {
  const slug =
    article.slug ||
    generateArticleSlug(
      article.title,
      article.publishedAt || article.published_at
    );

  return {
    ...article,
    slug,
    title: article.title || article.turkishTitle || "Başlık yok",
    summary: article.summary || article.description || "",
    source: article.sourceName || article.source_name || article.source || "Kaynak",
    source_name: article.source_name || article.sourceName || article.source || "Kaynak",
    category: article.category || "dunya",
    publishedAt:
      article.publishedAt ||
      article.published_at ||
      new Date().toISOString(),
    imageUrl: article.imageUrl || article.image || article.thumbnail || article.image_url || null,
    image_url: article.image_url || article.imageUrl || article.image || article.thumbnail || null,
  };
}
