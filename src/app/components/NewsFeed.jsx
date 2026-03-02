"use client";

import { sortByHistory } from "@/app/hooks/useReadingHistory";
import { useCallback, useEffect, useState } from "react";
import NewsCard from "./NewsCard";
import NewsCardSkeleton from "./NewsCardSkeleton";

export default function NewsFeed({ initialArticles, initialNextPage }) {
  const [articles, setArticles] = useState(initialArticles);
  const [nextPage, setNextPage] = useState(initialNextPage);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(!initialNextPage);

  // Client mount'ta localStorage geçmişine göre sırala
  useEffect(() => {
    setArticles((prev) => sortByHistory(prev));
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

  return (
    <div>
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
        {loading && [0, 1, 2].map((i) => <NewsCardSkeleton key={`sk-${i}`} index={i} />)}
      </div>

      {/* Load more / exhausted */}
      <div className="flex flex-col items-center gap-2 mt-10">
        {!exhausted ? (
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 font-semibold text-white transition-all bg-gray-900 dark:bg-white dark:text-gray-900 rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? "Yükleniyor..." : (
              <>
                Daha Fazla Haber
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
