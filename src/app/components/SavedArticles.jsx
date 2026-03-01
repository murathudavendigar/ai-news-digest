"use client";

import { useState } from "react";
import Link from "next/link";
import NewsCard from "./NewsCard";
import { useBookmarks } from "@/app/lib/useBookmarks";

export default function SavedArticles() {
  const { bookmarks, clear, toggle, mounted } = useBookmarks();
  const [confirmClear, setConfirmClear] = useState(false);

  if (!mounted)
    return (
      <div className="grid grid-cols-1 gap-5 mt-8 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-64 bg-stone-100 dark:bg-stone-800 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );

  return (
    <div>
      {/* Başlık */}
      <div className="flex items-start justify-between pb-6 mb-8 border-b border-stone-200 dark:border-stone-700">
        <div>
          <p className="mb-2 text-xs tracking-widest uppercase text-stone-400">
            Okuma Listesi
          </p>
          <h1
            className="text-2xl font-black text-stone-900 dark:text-stone-50"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
            Kaydedilenler
            <span className="ml-3 text-base font-normal text-stone-400">
              {bookmarks.length} haber
            </span>
          </h1>
        </div>

        {bookmarks.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            {confirmClear ? (
              <>
                <span className="text-xs text-stone-500">Emin misiniz?</span>
                <button
                  onClick={() => {
                    clear();
                    setConfirmClear(false);
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors">
                  Evet, Temizle
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 transition-colors">
                  İptal
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                Tümünü Temizle
              </button>
            )}
          </div>
        )}
      </div>

      {/* Boş durum */}
      {bookmarks.length === 0 ? (
        <div className="py-24 text-center">
          <p className="mb-4 text-5xl">🔖</p>
          <h3 className="mb-2 text-lg font-bold text-stone-700 dark:text-stone-300">
            Henüz kayıt yok
          </h3>
          <p className="max-w-sm mx-auto mb-8 text-sm text-stone-400">
            Haberlerdeki yer imi ikonuna tıklayarak haberleri okuma listenize
            ekleyebilirsiniz.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 dark:bg-stone-100
                       text-white dark:text-stone-900 text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
            Haberlere Gözat
          </Link>
        </div>
      ) : (
        <>
          {/* Kayıt tarihi gruplandırma */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((article) => (
              <div key={article.article_id} className="relative group">
                <NewsCard article={article} />
                {/* Kaydetme tarihi */}
                {article.savedAt && (
                  <div className="px-1 mt-1">
                    <p className="text-[10px] text-stone-400 dark:text-stone-600">
                      🔖{" "}
                      {new Date(article.savedAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      kaydedildi
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="mt-10 text-xs text-center text-stone-400">
            Kaydedilenler bu tarayıcıda saklanır ve hesabınıza bağlı değildir.
          </p>
        </>
      )}
    </div>
  );
}
