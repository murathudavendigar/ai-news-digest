"use client";

import { useCallback, useEffect, useState } from "react";

const SENTIMENT_CONFIG = {
  positive: {
    label: "Pozitif",
    color: "text-green-600 dark:text-green-400",
    icon: "📈",
  },
  negative: {
    label: "Negatif",
    color: "text-red-600 dark:text-red-400",
    icon: "📉",
  },
  neutral: {
    label: "Nötr",
    color: "text-gray-600 dark:text-gray-400",
    icon: "➖",
  },
};

const CONFIDENCE_CONFIG = {
  high: {
    label: "Yüksek",
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  },
  medium: {
    label: "Orta",
    color:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  },
  low: {
    label: "Düşük",
    color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  },
};

/**
 * @param {{ article: object, forceLanguage?: string, fast?: boolean }} props
 * article must include articleId field for caching to work.
 */
export default function AISummary({ article, forceLanguage, fast = false }) {
  const [state, setState] = useState("idle"); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSummary = useCallback(
    async (forceRefresh = false) => {
      setState("loading");
      setErrorMsg("");

      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article, forceLanguage, fast, forceRefresh }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "API hatası");
        }

        const data = await res.json();
        setResult(data);
        setState("success");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Bilinmeyen hata");
        setState("error");
      }
    },
    [article, forceLanguage, fast],
  );

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="p-6 border rounded-2xl border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-600">
            <svg
              className="w-4 h-4 text-white animate-spin"
              fill="none"
              viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-violet-900 dark:text-violet-100">
              AI Analiz Oluşturuluyor
            </p>
            <p className="text-xs text-violet-500 dark:text-violet-400">
              Groq · LLaMA 3.3 70B
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {[100, 80, 90, 60].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded-full bg-violet-200 dark:bg-violet-800 animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div className="p-6 border border-red-200 rounded-2xl dark:border-red-800 bg-red-50 dark:bg-red-950/30">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="mb-1 font-bold text-red-800 dark:text-red-300">
              Özet Oluşturulamadı
            </p>
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">
              {errorMsg}
            </p>
            <button
              onClick={() => fetchSummary(false)}
              className="px-4 py-2 text-xs font-bold text-red-700 transition-colors bg-red-100 rounded-lg dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60">
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (state === "success" && result) {
    const sentiment =
      SENTIMENT_CONFIG[result.sentiment] ?? SENTIMENT_CONFIG.neutral;
    const confidence =
      CONFIDENCE_CONFIG[result.confidence] ?? CONFIDENCE_CONFIG.low;
    const fromCache = result.fromCache;

    return (
      <div className="overflow-hidden border rounded-2xl border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-violet-200 dark:border-violet-800">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center text-xs font-bold text-white rounded-full w-7 h-7 bg-violet-600">
              ✦
            </span>
            <div>
              <p className="text-sm font-bold leading-none text-violet-900 dark:text-violet-100">
                AI Analiz
              </p>
              <p className="text-[10px] text-violet-500 dark:text-violet-400 mt-0.5 uppercase tracking-wider">
                Groq · LLaMA 3.3 70B · {result.resolvedLanguage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cache badge */}
            {fromCache ? (
              <span
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                title="Bu özet cache'den yüklendi, API çağrısı yapılmadı">
                ⚡ Cache
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">
                ✨ Yeni
              </span>
            )}

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${confidence.color}`}>
              Güven: {confidence.label}
            </span>
            <span className="text-[10px] text-violet-500 dark:text-violet-400">
              ~{result.readingTimeMinutes} dk
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-[15px]">
            {result.analysis}
          </p>

          {result.keyPoints?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold tracking-wider uppercase text-violet-700 dark:text-violet-400">
                Önemli Noktalar
              </p>
              <ul className="space-y-1.5">
                {result.keyPoints.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-violet-500 dark:text-violet-400 mt-0.5 font-bold shrink-0">
                      •
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-violet-200 dark:border-violet-800">
            <div className="flex items-center gap-1.5 text-xs">
              <span>{sentiment.icon}</span>
              <span className={`font-medium ${sentiment.color}`}>
                Ton: {sentiment.label}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-violet-400 dark:text-violet-500">
                {new Date(result.generatedAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

              {/* Force refresh button */}
              <button
                onClick={() => fetchSummary(true)}
                title="Yeni özet oluştur (cache'i yoksay)"
                className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors">
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
                Yenile
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="px-6 py-3 border-t bg-violet-100/50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800">
          <p className="text-[10px] text-violet-500 dark:text-violet-500 text-center">
            Bu özet yapay zeka tarafından otomatik oluşturulmuştur. Haberin tam
            içeriğini okumak için aşağıdaki bağlantıyı kullanın.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
