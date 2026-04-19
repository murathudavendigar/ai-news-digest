"use client";

import NewsCard from "@/app/components/NewsCard";
import { INTERNATIONAL_SOURCES } from "@/app/lib/internationalSources";
import { useState } from "react";

export default function DunyaFeed({ initialArticles }) {
  const [activeSource, setActiveSource] = useState("all");

  const filteredArticles =
    activeSource === "all"
      ? initialArticles
      : initialArticles.filter((a) => a.sourceId === activeSource);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x active:cursor-grabbing">
        <button
          onClick={() => setActiveSource("all")}
          className={`snap-center shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeSource === "all"
              ? "bg-amber-600 text-white"
              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}>
          Tümü
        </button>
        {INTERNATIONAL_SOURCES.map((src) => (
          <button
            key={src.id}
            onClick={() => setActiveSource(src.id)}
            className={`snap-center shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeSource === src.id
                ? "bg-amber-600 text-white"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
            }`}>
            {src.name}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article, idx) => (
            <NewsCard
              key={`${article.article_id || idx}`}
              article={article}
              priority={idx < 2}
            />
          ))
        ) : (
          <div className="py-12 text-center text-stone-500">
            Haber bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
