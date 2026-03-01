// hooks/useReadingHistory.js
// localStorage'da kategori okuma geçmişi tutar.
// NewsFeed: geçmişe göre haberleri sıralar.
// TrackRead: makale sayfası açılınca çağrılır.

const STORAGE_KEY = "hab_reading_history_v1";
const MAX_PER_CATEGORY = 50; // sayaç taşmasını önle

function load() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function save(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

/** Makale kategorilerini geçmişe ekle */
export function trackRead(categories = []) {
  if (!categories.length) return;
  const history = load();
  for (const cat of categories) {
    if (!cat) continue;
    const current = history[cat] || 0;
    history[cat] = Math.min(current + 1, MAX_PER_CATEGORY);
  }
  save(history);
}

/** Makaleye geçmişe göre öncelik skoru hesapla (yüksek → önce) */
export function getArticleScore(article) {
  const history = load();
  const cats = article.category || [];
  if (!cats.length) return 0;
  return cats.reduce((sum, cat) => sum + (history[cat] || 0), 0);
}

/** Makaleleri okuma geçmişine göre sırala */
export function sortByHistory(articles) {
  if (!articles?.length) return articles;
  const history = load();
  if (!Object.keys(history).length) return articles; // geçmiş yoksa orijinal sıra

  return [...articles].sort((a, b) => {
    const scoreA = (a.category || []).reduce(
      (s, c) => s + (history[c] || 0),
      0,
    );
    const scoreB = (b.category || []).reduce(
      (s, c) => s + (history[c] || 0),
      0,
    );
    return scoreB - scoreA; // yüksek skor → üste
  });
}
