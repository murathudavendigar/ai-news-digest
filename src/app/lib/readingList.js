export function getSavedArticles() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('haberai_saved_articles') || '[]');
  } catch { return []; }
}

export function saveArticle(article) {
  if (typeof window === 'undefined') return;
  const saved = getSavedArticles();
  const exists = saved.some(a => a.slug === article.slug);
  if (exists) return;
  const lightweight = {
    slug: article.slug,
    title: article.title,
    source: article.source,
    category: article.category,
    publishedAt: article.publishedAt || article.published_at,
    imageUrl: article.imageUrl || article.image,
    url: article.url,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(
    'haberai_saved_articles',
    JSON.stringify([lightweight, ...saved].slice(0, 100))
  );
  window.dispatchEvent(new Event('haberai_saved_articles_updated'));
}

export function unsaveArticle(slug) {
  if (typeof window === 'undefined') return;
  const saved = getSavedArticles().filter(a => a.slug !== slug);
  localStorage.setItem('haberai_saved_articles', JSON.stringify(saved));
  window.dispatchEvent(new Event('haberai_saved_articles_updated'));
}

export function isArticleSaved(slug) {
  if (typeof window === 'undefined') return false;
  return getSavedArticles().some(a => a.slug === slug);
}
