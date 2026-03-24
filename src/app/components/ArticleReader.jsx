"use client";

import { useEffect, useState } from "react";

function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700 ${className}`}
    />
  );
}

export default function ArticleReader({ url, hasExistingContent }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(!hasExistingContent);

  useEffect(() => {
    if (!url) return;

    setLoading(true);
    fetch(`/api/reader?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((result) => setData(result))
      .catch(() => setData({ scrapingFailed: true }))
      .finally(() => setLoading(false));
  }, [url]);

  // Nothing to show
  if (!loading && (!data || data.scrapingFailed)) return null;

  return (
    <div className="mt-8 border-t border-stone-100 dark:border-stone-800 pt-6">
      {/* Header + toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full group mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">📖</span>
          <span className="text-sm font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
            Haberin Tamamı
          </span>
          {data?.sourceName && (
            <span className="text-xs text-stone-400 dark:text-stone-500">
              — {data.sourceName}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
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
      </button>

      {expanded && (
        <>
          {/* AI Summary */}
          {loading ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 mb-6">
              <Skeleton className="h-4 w-1/3 mb-3 bg-amber-200! dark:bg-amber-900/40!" />
              <Skeleton className="h-3 w-full mb-2 bg-amber-200! dark:bg-amber-900/40!" />
              <Skeleton className="h-3 w-full mb-2 bg-amber-200! dark:bg-amber-900/40!" />
              <Skeleton className="h-3 w-2/3 bg-amber-200! dark:bg-amber-900/40!" />
            </div>
          ) : data?.summary ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 mb-6">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">🤖</span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  AI Özeti
                </span>
              </div>
              <p
                className="text-sm leading-relaxed text-stone-700 dark:text-stone-300"
                style={{
                  fontFamily: "var(--font-body, Georgia, serif)",
                }}>
                {data.summary}
              </p>
            </div>
          ) : null}

          {/* Full text */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-3 w-full" />
              ))}
              <Skeleton className="h-3 w-2/3" />
            </div>
          ) : data?.bodyText ? (
            <div
              className="text-base leading-relaxed text-stone-700 dark:text-stone-300"
              style={{
                fontFamily: "var(--font-body, Georgia, serif)",
              }}>
              {data.bodyText
                .split(/\n\n+/)
                .filter(Boolean)
                .map((para, i) => {
                  const trimmed = para.trim();
                  if (trimmed.startsWith("## ")) {
                    return (
                      <h3
                        key={i}
                        className="text-xl font-bold mt-6 mb-3 text-stone-900 dark:text-white"
                        style={{
                          fontFamily:
                            "var(--font-display, Georgia, serif)",
                        }}>
                        {trimmed.replace("## ", "")}
                      </h3>
                    );
                  }
                  if (trimmed.startsWith("> ")) {
                    return (
                      <blockquote
                        key={i}
                        className="border-l-4 border-amber-400 pl-4 italic text-stone-600 dark:text-stone-400 my-4">
                        {trimmed.replace("> ", "")}
                      </blockquote>
                    );
                  }
                  return (
                    <p key={i} className="mb-4">
                      {trimmed}
                    </p>
                  );
                })}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
