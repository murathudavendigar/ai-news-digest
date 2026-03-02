"use client";

import { useArticleHistory } from "@/app/lib/useArticleHistory";
import { useBookmarks } from "@/app/lib/useBookmarks";
import Link from "next/link";
import { useState } from "react";
import NewsCard from "./NewsCard";

export default function SavedArticles() {
  const { bookmarks, clear, toggle, mounted } = useBookmarks();
  const {
    history,
    clearHistory,
    mounted: historyMounted,
  } = useArticleHistory();
  const [confirmClear, setConfirmClear] = useState(false);
  const [activeTab, setActiveTab] = useState("bookmarks"); // "bookmarks" | "history"

  if (!mounted || !historyMounted)
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

  const isHistory = activeTab === "history";
  const activeList = isHistory ? history : bookmarks;

  return (
    <div>
      {/* Başlık */}
      <div className="flex items-start justify-between pb-6 mb-6 border-b border-stone-200 dark:border-stone-700">
        <div>
          <p className="mb-2 text-xs tracking-widest uppercase text-stone-400">
            Okuma Listesi
          </p>
          <h1
            className="text-2xl font-black text-stone-900 dark:text-stone-50"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
            {isHistory ? "Okuma Geçmişi" : "Kaydedilenler"}
          </h1>
        </div>

        {/* Temizle butonu */}
        {activeList.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            {confirmClear ? (
              <>
                <span className="text-xs text-stone-500">Emin misiniz?</span>
                <button
                  onClick={() => {
                    isHistory ? clearHistory() : clear();
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

      {/* Sekme seçici */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => {
            setActiveTab("bookmarks");
            setConfirmClear(false);
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            !isHistory
              ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
              : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}>
          🔖 Kaydedilenler
          <span className="text-[11px] opacity-70">({bookmarks.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            setConfirmClear(false);
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            isHistory
              ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
              : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}>
          📖 Geçmiş
          <span className="text-[11px] opacity-70">({history.length})</span>
        </button>
      </div>

      {/* Boş durum */}
      {activeList.length === 0 ? (
        <div className="py-24 text-center">
          <p className="mb-4 text-5xl">{isHistory ? "📰" : "🔖"}</p>
          <h3 className="mb-2 text-lg font-bold text-stone-700 dark:text-stone-300">
            {isHistory ? "Henüz okunmuş haber yok" : "Henüz kayıt yok"}
          </h3>
          <p className="max-w-sm mx-auto mb-8 text-sm text-stone-400">
            {isHistory
              ? "Haberlere tıkladığınızda burada görünecek."
              : "Haberlerdeki yer imi ikonuna tıklayarak haberleri okuma listenize ekleyebilirsiniz."}
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {activeList.map((article) => (
              <div key={article.article_id} className="relative group">
                <NewsCard article={article} />
                {/* Tarih bilgisi */}
                {(article.savedAt || article.readAt) && (
                  <div className="px-1 mt-1">
                    <p className="text-[10px] text-stone-400 dark:text-stone-600">
                      {isHistory ? "📖" : "🔖"}{" "}
                      {new Date(
                        isHistory ? article.readAt : article.savedAt,
                      ).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      {isHistory ? "okundu" : "kaydedildi"}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="mt-10 text-xs text-center text-stone-400">
            {isHistory
              ? `Son ${history.length} okunan haber gösteriliyor.`
              : "Kaydedilenler bu tarayıcıda saklanır ve hesabınıza bağlı değildir."}
          </p>
        </>
      )}
    </div>
  );
}
