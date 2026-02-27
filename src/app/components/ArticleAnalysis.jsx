"use client";

import { useState, useEffect, useCallback } from "react";
import NewsScore from "./NewsScore";
import NewsContext from "./NewsContext";

export default function ArticleAnalysis({ article }) {
  const [state, setState] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const fetchAnalysis = useCallback(
    async (forceRefresh = false) => {
      setState("loading");
      setError("");

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article, forceRefresh }),
        });

        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "API hatası");

        setResult(data);
        setState("success");
      } catch (err) {
        setError(err.message);
        setState("error");
      }
    },
    [article],
  );

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[
          "Güvenilirlik Skoru Hesaplanıyor",
          "Bağlam Zinciri Oluşturuluyor",
        ].map((label, i) => (
          <div
            key={i}
            className="p-6 border border-gray-200 rounded-2xl dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gray-300 rounded-full dark:bg-gray-600 animate-pulse" />
              <div className="flex-1">
                <div
                  className="h-3 mb-1 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"
                  style={{ width: "60%" }}
                />
                <div
                  className="h-2 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"
                  style={{ width: "40%" }}
                />
              </div>
            </div>
            <p className="mb-3 text-xs text-center text-gray-400 dark:text-gray-500">
              {label}...
            </p>
            <div className="space-y-2">
              {[100, 75, 90, 60].map((w, j) => (
                <div
                  key={j}
                  className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"
                  style={{ width: `${w}%`, animationDelay: `${j * 100}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div className="p-6 border border-red-200 rounded-2xl dark:border-red-800 bg-red-50 dark:bg-red-950/30">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="mb-1 font-bold text-red-800 dark:text-red-300">
              Analiz Yapılamadı
            </p>
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
            <button
              onClick={() => fetchAnalysis(false)}
              className="px-4 py-2 text-xs font-bold text-red-700 transition-colors bg-red-100 rounded-lg dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200">
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (state === "success" && result) {
    return (
      <div className="space-y-4">
        {/* Cache + refresh header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold tracking-wider text-gray-400 uppercase dark:text-gray-500">
            Derin Analiz
          </p>
          <div className="flex items-center gap-2">
            {result.fromCache && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                ⚡ Cache
              </span>
            )}
            <button
              onClick={() => fetchAnalysis(true)}
              title="Yenile"
              className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300">
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
            </button>
          </div>
        </div>

        {/* Score + Context */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <NewsScore score={result.score} />
          <NewsContext context={result.context} />
        </div>
      </div>
    );
  }

  return null;
}
