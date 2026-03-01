"use client";

import { formatDate } from "@/app/lib/news";
import Link from "next/link";
import { useCallback, useState } from "react";

const VERDICT_COLORS = {
  reliable: "text-emerald-400 bg-emerald-950/60 border-emerald-700",
  questionable: "text-amber-400 bg-amber-950/60 border-amber-700",
  unreliable: "text-red-400 bg-red-950/60 border-red-700",
};

const VERDICT_LABELS = {
  reliable: "Güvenilir",
  questionable: "Şüpheli",
  unreliable: "Güvenilmez",
};

const SCORE_LABELS = {
  reliability: "Güvenilirlik",
  neutrality: "Tarafsızlık",
  emotionalLanguage: "Duygusal Dil",
  sourceReputation: "Kaynak",
};

export default function NewsCard({ article, priority = false }) {
  const [scorePreview, setScorePreview] = useState(null);
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(async () => {
    setHovered(true);
    if (scorePreview !== null) return;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.fromCache && data.score) setScorePreview(data.score);
    } catch {}
  }, [article, scorePreview]);

  const verdictCfg = scorePreview
    ? {
        color:
          VERDICT_COLORS[scorePreview.verdict] || VERDICT_COLORS.questionable,
        label: VERDICT_LABELS[scorePreview.verdict] || "Şüpheli",
      }
    : null;

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}>
      <Link
        href={`/news/${article.article_id}`}
        className="block overflow-hidden transition-all duration-300 bg-white border shadow-sm group dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-2xl hover:shadow-lg hover:border-stone-400 dark:hover:border-stone-600">
        {/* Görsel */}
        <div className="relative h-48 overflow-hidden bg-stone-100 dark:bg-stone-800">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={article.title}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-stone-100 dark:bg-stone-800">
              <span className="text-5xl opacity-20">📰</span>
            </div>
          )}

          {/* Üstten aşağı gradient — kaynak badge okunabilirliği için */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

          {/* Kaynak badge */}
          <div
            className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1
                          bg-black/60 backdrop-blur-sm rounded-full">
            {article.source_icon && (
              <img
                src={article.source_icon}
                className="w-3.5 h-3.5 rounded-full"
                alt=""
              />
            )}
            <span className="text-[10px] font-bold text-white tracking-wide">
              {article.source_name}
            </span>
          </div>

          {/* Skor badge — cache'de varsa */}
          {scorePreview && (
            <div
              className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5
                            rounded-full border text-[10px] font-black backdrop-blur-sm
                            ${verdictCfg.color}`}>
              {scorePreview.overallScore}
              <span className="font-medium opacity-80">{verdictCfg.label}</span>
            </div>
          )}

          {/* Kategori chip — sol alt */}
          {article.category?.[0] && (
            <div className="absolute bottom-3 left-3">
              <span
                className="text-[9px] font-black uppercase tracking-widest
                               px-2 py-0.5 bg-stone-950/80 text-stone-300 rounded-sm">
                {article.category[0]}
              </span>
            </div>
          )}
        </div>

        {/* İçerik */}
        <div className="p-4">
          <h3
            className="mb-2 text-sm font-bold leading-snug transition-colors text-stone-900 dark:text-stone-100 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
            {article.title}
          </h3>

          {article.description && (
            <p className="mb-3 text-xs leading-relaxed text-stone-500 dark:text-stone-400 line-clamp-2">
              {article.description}
            </p>
          )}

          <div
            className="flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500
                          pt-3 border-t border-stone-100 dark:border-stone-800">
            <span className="flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatDate(article.pubDate)}
            </span>
            {article.creator?.[0] && (
              <span className="truncate max-w-[120px]">
                {article.creator[0]}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Hover tooltip */}
      {hovered && scorePreview && (
        <div
          className="absolute z-30 w-56 p-3 mb-2 -translate-x-1/2 border shadow-2xl pointer-events-none bottom-full left-1/2 bg-stone-950 border-stone-700 rounded-xl">
          <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-2.5">
            Güvenilirlik Skoru
          </p>
          {Object.entries(scorePreview.scores || {}).map(([key, val]) => {
            const display = key === "emotionalLanguage" ? 100 - val : val;
            const color =
              display >= 70
                ? "bg-emerald-500"
                : display >= 40
                  ? "bg-amber-500"
                  : "bg-red-500";
            return (
              <div key={key} className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] text-stone-500 w-20 shrink-0">
                  {SCORE_LABELS[key]}
                </span>
                <div className="flex-1 h-1 rounded-full bg-stone-800">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className="text-[9px] font-black text-stone-300 w-5 text-right tabular-nums">
                  {val}
                </span>
              </div>
            );
          })}
          {/* Ok */}
          <div
            className="absolute w-0 h-0 -translate-x-1/2 border-t-4 border-l-4 border-r-4 top-full left-1/2 border-l-transparent border-r-transparent border-t-stone-950"
          />
        </div>
      )}
    </div>
  );
}
