"use client";
// components/DailySummary.jsx
// Ana sayfada günlük özet kartı — sabah kahvesiyle okunabilir format

import { useState, useEffect } from "react";

export default function DailySummary() {
  const [state, setState] = useState("loading");
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/daily-summary")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setState("error");
        else {
          setData(d);
          setState("success");
        }
      })
      .catch(() => setState("error"));
  }, []);

  if (state === "loading") {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4" />
          </div>
        </div>
        <div className="space-y-2">
          {[100, 80, 90].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (state === "error" || !data) return null;

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 overflow-hidden mb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-lg">
            ☀️
          </div>
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-100 text-sm leading-none">
              Günlük Özet
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
              {data.date} · {data.articleCount} haber analiz edildi
            </p>
          </div>
        </div>
        {data.fromCache && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            ⚡ Güncel
          </span>
        )}
      </div>

      <div className="p-6">
        {/* Headline */}
        <h2 className="text-xl font-black text-amber-900 dark:text-amber-100 mb-3 leading-snug">
          {data.headline}
        </h2>

        {/* Intro */}
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
          {data.intro}
        </p>

        {/* Top stories */}
        {data.topStories?.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {data.topStories.map((story, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xs font-black text-amber-500 mt-0.5 w-4 shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                  {story}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Sections — toggle ile açılır */}
        {data.sections?.length > 0 && (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors mb-4">
              {expanded ? "Daha az göster" : "Detaylı özetleri gör"}
              <svg
                className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.sections.map((section, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-amber-100 dark:border-amber-900/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{section.emoji}</span>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        {section.title}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {section.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Closing note */}
        {data.closingNote && (
          <p className="mt-4 text-xs text-amber-600 dark:text-amber-500 italic border-t border-amber-200 dark:border-amber-800 pt-4">
            {data.closingNote}
          </p>
        )}
      </div>
    </div>
  );
}
