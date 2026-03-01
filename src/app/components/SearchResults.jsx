"use client";

import { useState } from "react";
import NewsCard from "./NewsCard";

const CATEGORY_LABELS = {
  technology: "Teknoloji",
  sports: "Spor",
  business: "Ekonomi",
  health: "Sağlık",
  entertainment: "Magazin",
  politics: "Politika",
  world: "Dünya",
};

function highlight(text, query) {
  if (!text || !query) return text;
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return text;
  const re = new RegExp(
    `(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  const parts = text.split(re);
  return parts.map((p, i) =>
    re.test(p) ? (
      <mark
        key={i}
        className="bg-amber-200 dark:bg-amber-800/60 text-inherit rounded px-0.5">
        {p}
      </mark>
    ) : (
      p
    ),
  );
}

export default function SearchResults({ query, articles }) {
  const [activeCategory, setActiveCategory] = useState("all");

  // Mevcut kategorileri topla
  const categoryCounts = articles.reduce((acc, a) => {
    const cat = a.category?.[0] || "other";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const filtered =
    activeCategory === "all"
      ? articles
      : articles.filter((a) => a.category?.[0] === activeCategory);

  /* ── Boş sorgu ── */
  if (!query)
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-5xl">🔍</p>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Yukarıdaki arama çubuğunu kullanın veya{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 text-[11px] font-mono">
            ⌘K
          </kbd>{" "}
          tuşuna basın
        </p>
      </div>
    );

  /* ── Sonuç yok ── */
  if (!articles.length)
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-5xl">📭</p>
        <p className="mb-2 text-lg font-bold text-stone-700 dark:text-stone-300">
          Sonuç bulunamadı
        </p>
        <p className="mb-6 text-sm text-stone-400">
          &quot;<strong>{query}</strong>&quot; için güncel haberlerde sonuç yok. Farklı
          kelimeler deneyin.
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-stone-400">
          <span>İpuçları:</span>
          <span>· Daha kısa arama yapın</span>
          <span>· Türkçe karakter kullanın</span>
          <span>· Farklı kelime sırası deneyin</span>
        </div>
      </div>
    );

  return (
    <div>
      {/* Kategori filtreleri */}
      {Object.keys(categoryCounts).length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeCategory === "all"
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
            }`}>
            Tümü <span className="ml-1 opacity-60">{articles.length}</span>
          </button>
          {Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                }`}>
                {CATEGORY_LABELS[cat] || cat}{" "}
                <span className="ml-1 opacity-60">{count}</span>
              </button>
            ))}
        </div>
      )}

      {/* Sonuçlar — NewsCard ile, highlight'lı başlık */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((article, i) => (
          <NewsCard
            key={article.article_id}
            article={{
              ...article,
              // highlight için başlığı override et — NewsCard title'ı prop olarak kabul ediyorsa
              _highlightTitle: highlight(article.title, query),
            }}
            priority={i < 3}
            highlightQuery={query}
          />
        ))}
      </div>

      {filtered.length < articles.length && (
        <p className="mt-8 text-xs text-center text-stone-400">
          {filtered.length} / {articles.length} sonuç gösteriliyor
        </p>
      )}
    </div>
  );
}
