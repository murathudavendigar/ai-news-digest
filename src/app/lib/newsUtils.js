/**
 * Generates a URL-safe slug from an article title + date.
 * Turkish chars converted, special chars stripped.
 */
export function generateArticleSlug(title, publishedAt) {
  if (!title) return null;

  const date = publishedAt
    ? new Date(publishedAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

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

  return `${slug}-${date}`;
}

/**
 * Ensures an article object always has a slug.
 * Call this wherever articles are fetched/transformed.
 */
export function normalizeArticle(article) {
  return {
    ...article,
    slug:
      article.slug ||
      generateArticleSlug(article.title, article.publishedAt || article.published_at),
  };
}
