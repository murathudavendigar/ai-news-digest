"use client";

import { formatDate } from "@/app/lib/news";
import Link from "next/link";
import { useCallback, useState } from "react";

const VERDICT_COLORS = {
  reliable: "text-emerald-600 bg-emerald-50 border-emerald-200",
  questionable: "text-amber-600 bg-amber-50 border-amber-200",
  unreliable: "text-red-600 bg-red-50 border-red-200",
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

  // Sadece cache'de varsa çek — yoksa hiçbir şey yapma, sıfır ek API çağrısı
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
      if (data.fromCache && data.score) {
        setScorePreview(data.score);
      }
    } catch {
      // Sessizce geç
    }
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
        className="block overflow-hidden transition-all duration-300 bg-white border border-gray-200 shadow-md group dark:bg-gray-800 rounded-xl hover:shadow-xl dark:border-gray-700">
        {/* Görsel */}
        <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={article.title}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700">
              <span className="text-8xl">📰</span>
            </div>
          )}

          {/* Kaynak Badge */}
          <div className="absolute px-3 py-1 rounded-full top-3 left-3 bg-black/70 backdrop-blur-sm">
            <span className="flex items-center gap-1 text-xs font-semibold text-white">
              <img
                src={article.source_icon}
                className="w-4 h-4 rounded-full"
                alt={article.source_name}
              />
              {article.source_name}
            </span>
          </div>

          {/* Skor badge — sadece cache'de varsa */}
          {scorePreview && (
            <div
              className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold backdrop-blur-sm ${verdictCfg.color}`}>
              <span className="font-black">{scorePreview.overallScore}</span>
              <span>{verdictCfg.label}</span>
            </div>
          )}
        </div>

        {/* İçerik */}
        <div className="p-5">
          <h3 className="mb-2 text-lg font-bold text-gray-900 transition-colors dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400">
            {article.title}
          </h3>

          {article.description && (
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {article.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
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

            {article.creator && (
              <span className="truncate ml-2 max-w-37.5">
                {article.creator[0].toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Hover tooltip — sadece skor cache'de varsa gösterilir */}
      {hovered && scorePreview && (
        <div className="absolute z-20 w-56 p-3 mb-2 -translate-x-1/2 bg-white border border-gray-200 shadow-2xl pointer-events-none bottom-full left-1/2 dark:bg-gray-900 rounded-xl dark:border-gray-700">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Güvenilirlik Skoru
          </p>
          {Object.entries(scorePreview.scores || {}).map(([key, val]) => {
            const display = key === "emotionalLanguage" ? 100 - val : val;
            const color =
              display >= 70
                ? "bg-emerald-400"
                : display >= 40
                  ? "bg-amber-400"
                  : "bg-red-400";
            return (
              <div key={key} className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 w-20 shrink-0">
                  {SCORE_LABELS[key] || key}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 w-6 text-right">
                  {val}
                </span>
              </div>
            );
          })}
          {/* Ok işareti */}
          <div className="absolute w-0 h-0 -translate-x-1/2 border-t-4 border-l-4 border-r-4 top-full left-1/2 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
