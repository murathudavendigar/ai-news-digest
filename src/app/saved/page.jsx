"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSavedArticles, unsaveArticle } from "@/app/lib/readingList";

export default function SavedArticlesPage() {
  const [saved, setSaved] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadSaved = () => setSaved(getSavedArticles());
    
    loadSaved();
    
    const handleStorageUpdate = () => loadSaved();
    window.addEventListener("haberai_saved_articles_updated", handleStorageUpdate);
    
    return () => {
      window.removeEventListener("haberai_saved_articles_updated", handleStorageUpdate);
    };
  }, []);

  const handleClearAll = () => {
    if (confirm("Tüm kaydedilen haberleri silmek istediğinize emin misiniz?")) {
      localStorage.removeItem("haberai_saved_articles");
      setSaved([]);
      window.dispatchEvent(new Event("haberai_saved_articles_updated"));
    }
  };

  const handleRemove = (slug) => {
    unsaveArticle(slug);
    setSaved(s => s.filter(a => a.slug !== slug));
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-stone-900 dark:text-white" style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
              Okuma Listem
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-xs font-bold text-stone-600 dark:text-stone-400">
              {saved.length}
            </span>
          </div>
          {saved.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Tümünü Temizle
            </button>
          )}
        </div>

        {saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-6 opacity-30">🔖</div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
              Henüz kaydettiğin haber yok
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 max-w-sm">
              Gözüne çarpan ama şu an okumaya vaktin olmayan haberleri kaydedip burada bulabilirsin.
            </p>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
            >
              Haberleri keşfet →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {saved.map((article) => (
              <div
                key={article.slug}
                className="flex items-center gap-4 p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm group hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
              >
                <Link href={`/news/${article.slug}`} className="shrink-0">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800">
                    {article.imageUrl ? (
                      <img src={article.imageUrl} alt={article.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full opacity-20 text-2xl">📰</div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-stone-400 truncate">
                      {article.source}
                    </span>
                    <span className="text-stone-300 dark:text-stone-700">·</span>
                    <span className="text-[10px] text-stone-400 whitespace-nowrap">
                      {new Date(article.savedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} kaydedildi
                    </span>
                  </div>
                  <Link href={`/news/${article.slug}`}>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
                      {article.title}
                    </h3>
                  </Link>
                </div>
                <button
                  onClick={() => handleRemove(article.slug)}
                  className="p-2 shrink-0 rounded-full hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-stone-400 transition-colors"
                  aria-label="Kaydedilenlerden çıkar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
