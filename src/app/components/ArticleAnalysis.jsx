"use client";

import { useCallback, useEffect, useState } from "react";
import NewsContext from "./NewsContext";
import NewsScore from "./NewsScore";

function RefreshIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

export default function ArticleAnalysis({ article }) {
  const [state, setState] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = useCallback(
    async (force = false) => {
      setState("loading");
      setError("");
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article, forceRefresh: force }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "API hatası");
        if (data.skipped) {
          setState("skipped");
          return;
        }
        setResult(data);
        setState("success");
      } catch (e) {
        setError(e.message);
        setState("error");
      }
    },
    [article],
  );

  useEffect(() => {
    run();
  }, [run]);

  if (state === "skipped") return null;

  /* ── Loading ── */
  if (state === "loading")
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[
          "Güvenilirlik Skoru Hesaplanıyor…",
          "Bağlam Zinciri Oluşturuluyor…",
        ].map((label, i) => (
          <div
            key={i}
            className="overflow-hidden bg-white border rounded-2xl border-stone-200 dark:border-stone-700 dark:bg-stone-900">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
              <div className="w-4 h-4 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse" />
              <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                {label}
              </span>
            </div>
            <div className="p-5 space-y-2.5">
              {[100, 72, 88, 55, 78].map((w, j) => (
                <div
                  key={j}
                  className="h-2.5 rounded bg-stone-100 dark:bg-stone-800 animate-pulse"
                  style={{ width: `${w}%`, animationDelay: `${j * 80}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );

  /* ── Error ── */
  if (state === "error")
    return (
      <div className="p-5 border border-red-200 rounded-2xl dark:border-red-900 bg-red-50 dark:bg-red-950/20">
        <div className="flex items-start gap-3">
          <span className="text-red-500 shrink-0">⚠</span>
          <div className="flex-1">
            <p className="mb-1 text-sm font-bold text-red-800 dark:text-red-300">
              Analiz Yapılamadı
            </p>
            <p className="mb-3 text-xs text-red-600 dark:text-red-400">
              {process.env.NODE_ENV === "production"
                ? "Bir sorun oluştu. Lütfen tekrar deneyin."
                : error}
            </p>
            <button
              onClick={() => run(false)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors">
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );

  /* ── Success ── */
  if (state !== "success" || !result) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
          Derin Analiz
        </p>
        <div className="flex items-center gap-2">
          {process.env.NODE_ENV !== "production" && result.fromCache && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              ⚡ Cache
            </span>
          )}
          <button
            onClick={() => run(true)}
            title="Yenile"
            className="transition-colors text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300">
            <RefreshIcon />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NewsScore score={result.score} />
        <NewsContext context={result.context} />
      </div>

      {/* Fact-check chip'leri — score prompt'tan üretiliyor, mevcut cache'den geliyor */}
      {result.score?.factCheckSuggestions?.length > 0 && (
        <div className="p-4 border rounded-xl border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2.5">
            🔍 Doğrulama Önerileri
          </p>
          <div className="flex flex-wrap gap-2">
            {result.score.factCheckSuggestions.map((suggestion, i) => {
              // İddia metnini kısalt— ilk 60 kar
              const label =
                suggestion.length > 60
                  ? suggestion.slice(0, 57) + "…"
                  : suggestion;
              const query = encodeURIComponent(suggestion.slice(0, 120));
              return (
                <a
                  key={i}
                  href={`https://www.google.com/search?q=${query}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={suggestion}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full
                             bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700
                             text-stone-600 dark:text-stone-300
                             hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-400
                             transition-all">
                  <span className="text-[10px]">&#9654;</span>
                  {label}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
