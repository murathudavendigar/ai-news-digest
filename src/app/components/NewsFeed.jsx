"use client";

import { usePullToRefresh } from "@/app/hooks/usePullToRefresh";
import { sortByHistory } from "@/app/hooks/useReadingHistory";
import { sortByPreferredCategories } from "@/app/lib/useUserPreferences";
import { useCallback, useEffect, useState } from "react";
import NewsCard from "./NewsCard";
import NewsCardSkeleton from "./NewsCardSkeleton";

export default function NewsFeed({ initialArticles, initialNextPage }) {
  const [articles, setArticles] = useState(initialArticles);
  const [nextPage, setNextPage] = useState(initialNextPage);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(!initialNextPage);

  const { pullY, refreshing, threshold } = usePullToRefresh();

  // Client mount'ta localStorage geçmişine + tercihli kategorilere göre sırala
  useEffect(() => {
    const { preferredCategories = [] } = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("haberai:user-preferences") || "{}",
        );
      } catch {
        return {};
      }
    })();
    setArticles((prev) =>
      sortByPreferredCategories(sortByHistory(prev), preferredCategories),
    );
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextPage || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/news?page=${nextPage}`);
      const data = await res.json();

      setArticles((prev) => {
        // Duplicate'leri çıkar
        const existingIds = new Set(prev.map((a) => a.article_id));
        const fresh = (data.results || []).filter(
          (a) => !existingIds.has(a.article_id),
        );
        return sortByHistory([...prev, ...fresh]);
      });

      setNextPage(data.nextPage || null);
      if (!data.nextPage) setExhausted(true);
    } catch (err) {
      console.error("[NewsFeed] Load more error:", err);
    } finally {
      setLoading(false);
    }
  }, [nextPage, loading]);

  // Pull indicator - yüzde doluluk (0-1)
  const progress = Math.min(pullY / threshold, 1);
  const triggered = pullY >= threshold;

  return (
    <div>
      {/* ── Pull-to-Refresh Göstergesi (sadece mobilde) ── */}
      {(pullY > 0 || refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-150 md:hidden"
          style={{ height: refreshing ? 48 : pullY }}>
          <div
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              refreshing
                ? "text-amber-500"
                : triggered
                  ? "text-amber-500"
                  : "text-stone-400 dark:text-stone-500"
            }`}>
            {refreshing ? (
              /* Dönen spinner */
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 100 10z"
                />
              </svg>
            ) : (
              /* Yön oku — yeterince çekilince döner */
              <svg
                className="w-5 h-5 transition-transform duration-200"
                style={{
                  transform: triggered
                    ? "rotate(180deg)"
                    : `rotate(${progress * 180}deg)`,
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
            <span>
              {refreshing
                ? "Yenileniyor…"
                : triggered
                  ? "Bırak, yenile!"
                  : "Yenilemek için çek"}
            </span>
          </div>
        </div>
      )}

      {/* Haber grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, index) => (
          <NewsCard
            key={article.article_id}
            article={article}
            priority={index < 3}
          />
        ))}
        {/* Load-more sırasında grid'in sonuna skeleton ekle */}
        {loading &&
          [0, 1, 2].map((i) => <NewsCardSkeleton key={`sk-${i}`} index={i} />)}
      </div>

      {/* Load more / exhausted */}
      <div className="flex flex-col items-center gap-2 mt-10">
        {!exhausted ? (
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 font-semibold text-white transition-all bg-gray-900 dark:bg-white dark:text-gray-900 rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? (
              "Yükleniyor..."
            ) : (
              <>
                Daha Fazla Haber
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </button>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Tüm haberler yüklendi — {articles.length} haber gösteriliyor
          </p>
        )}
      </div>
    </div>
  );
}
