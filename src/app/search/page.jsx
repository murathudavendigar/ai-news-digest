import SearchResults from "@/app/components/SearchResults";
import { getLatest } from "@/app/lib/news";
import { getNewsFeed } from "@/app/lib/newsSource";

export function generateMetadata({ searchParams }) {
  const q = searchParams?.q || "";
  return {
    title: q ? `"${q}" — Arama` : "Arama",
    robots: q ? { index: true, follow: true } : { index: false, follow: true },
  };
}

function filterByQuery(results, query) {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  return (results || []).filter((a) => {
    const haystack = [
      a.title,
      a.description,
      a.source_name,
      Array.isArray(a.category) ? a.category.join(" ") : a.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q?.trim() || "";

  let articles = [];
  if (query) {
    try {
      const feed = await getNewsFeed({ page: 1, pageSize: 50 });
      articles = filterByQuery(feed.results || [], query);
    } catch {
      try {
        const data = await getLatest("tr");
        articles = filterByQuery(data.results || [], query);
      } catch {}
    }
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6">
        {/* Başlık */}
        <div className="pb-6 mb-8 border-b border-stone-200 dark:border-stone-700">
          <p className="mb-2 text-xs tracking-widest uppercase text-stone-400">
            Arama Sonuçları
          </p>
          {query ? (
            <h1
              className="text-2xl font-black text-stone-900 dark:text-stone-50"
              style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
              &quot;{query}&quot;
              <span className="ml-3 text-base font-normal text-stone-400">
                {articles.length} sonuç
              </span>
            </h1>
          ) : (
            <h1
              className="text-2xl font-black text-stone-900 dark:text-stone-50"
              style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
              Ne aramak istersiniz?
            </h1>
          )}
        </div>

        <SearchResults query={query} articles={articles} />
      </div>
    </div>
  );
}
