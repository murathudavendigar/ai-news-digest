/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSavedArticles, unsaveArticle } from "@/app/lib/readingList";

export default function SavedArticlesPage() {
  const [saved, setSaved] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
      setSaved(getSavedArticles());
    });
    const loadSaved = () => setSaved(getSavedArticles());

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
    setSaved((s) => s.filter((a) => a.slug !== slug));
  };

  if (!mounted) return null;

  return (
    <div className="page-shell min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-black text-[var(--text-primary)]">
              Okuma Listem
            </h1>
            <span className="rounded-full bg-[var(--bg-elevated)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-muted)]">
              {saved.length}
            </span>
          </div>
          {saved.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs font-bold text-red-500 transition-colors hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            >
              Tümünü Temizle
            </button>
          )}
        </div>

        {saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="mb-2 text-xl font-bold text-[var(--text-primary)]">
              Henüz kaydettiğin haber yok
            </p>
            <p className="mb-6 max-w-sm text-sm text-[var(--text-muted)]">
              Gözüne çarpan ama şu an okumaya vaktin olmayan haberleri kaydedip
              burada bulabilirsin.
            </p>
            <Link
              href="/"
              className="rounded-full bg-[var(--text-primary)] px-6 py-2.5 font-bold text-[var(--bg-primary)] transition-opacity hover:opacity-90"
            >
              Haberleri keşfet →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {saved.map((article) => (
              <div
                key={article.slug}
                className="group flex items-center gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 shadow-sm transition-colors hover:border-[var(--border-strong)]"
              >
                <Link href={`/news/${article.slug}`} className="shrink-0">
                  <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-[var(--bg-elevated)]">
                    {article.imageUrl ? (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl opacity-20">
                        📰
                      </div>
                    )}
                  </div>
                </Link>
                <div className="min-w-0 flex-1 py-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="truncate text-[10px] font-bold text-[var(--text-muted)]">
                      {article.source}
                    </span>
                    <span className="text-[var(--border-subtle)]">·</span>
                    <span className="whitespace-nowrap text-[10px] text-[var(--text-muted)]">
                      {new Date(article.savedAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      kaydedildi
                    </span>
                  </div>
                  <Link href={`/news/${article.slug}`}>
                    <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-sm font-bold leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-brand)]">
                      {article.title}
                    </h3>
                  </Link>
                </div>
                <button
                  onClick={() => handleRemove(article.slug)}
                  className="shrink-0 rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                  aria-label="Kaydedilenlerden çıkar"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
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
