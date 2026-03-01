"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SENTIMENT_CONFIG = {
  positive: {
    label: "Pozitif",
    color: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  negative: {
    label: "Negatif",
    color: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
  neutral: {
    label: "Nötr",
    color: "text-stone-500 dark:text-stone-400",
    dot: "bg-stone-400",
  },
};

const CONFIDENCE_CONFIG = {
  high: {
    label: "Yüksek Güven",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  medium: { label: "Orta Güven", color: "text-amber-600 dark:text-amber-400" },
  low: { label: "Düşük Güven", color: "text-red-600 dark:text-red-400" },
};

function Spinner({ className = "w-4 h-4" }) {
  return (
    <svg
      className={`${className} animate-spin`}
      fill="none"
      viewBox="0 0 24 24">
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export default function AISummary({ article, forceLanguage, fast = false }) {
  // "loading" ile başla — idle→loading geçişi olmaz, titreme yok
  const [state, setState] = useState("loading");
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const ranRef = useRef(false);

  const fetchSummary = useCallback(
    async (forceRefresh = false) => {
      setState("loading");
      setErrorMsg("");
      try {
        const res = await fetch("/api/article-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article, forceLanguage, fast, forceRefresh }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "API hatası");
        setResult(await res.json());
        setState("success");
      } catch (err) {
        setErrorMsg(err.message);
        setState("error");
      }
    },
    [article, forceLanguage, fast],
  );

  // İlk mount'ta bir kez çalış — StrictMode çift tetiklemesine karşı ref guard
  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    fetchSummary();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Loading ── */
  if (state === "loading")
    return (
      <div className="overflow-hidden border rounded-2xl border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
          <Spinner className="w-4 h-4 text-stone-400" />
          <p className="text-sm font-bold text-stone-600 dark:text-stone-300">
            AI Özet Oluşturuluyor
          </p>
          <span className="text-[10px] text-stone-400 ml-auto uppercase tracking-wider">
            AI ile özetleniyor…
          </span>
        </div>
        <div className="p-5 space-y-2.5">
          {[100, 82, 95, 68, 88].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded bg-stone-100 dark:bg-stone-800 animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );

  /* ── Error ── */
  if (state === "error")
    return (
      <div className="p-5 border border-red-200 rounded-2xl dark:border-red-800 bg-red-50 dark:bg-red-950/20">
        <div className="flex items-start gap-3">
          <span className="text-lg text-red-500 shrink-0">⚠</span>
          <div className="flex-1">
            <p className="mb-1 text-sm font-bold text-red-800 dark:text-red-300">
              Özet Oluşturulamadı
            </p>
            <p className="mb-3 text-xs text-red-600 dark:text-red-400">
              {errorMsg}
            </p>
            <button
              onClick={() => fetchSummary(false)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors">
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );

  /* ── Success ── */
  if (state !== "success" || !result) return null;

  const sentiment =
    SENTIMENT_CONFIG[result.sentiment] ?? SENTIMENT_CONFIG.neutral;
  const confidence =
    CONFIDENCE_CONFIG[result.confidence] ?? CONFIDENCE_CONFIG.low;

  return (
    <div className="overflow-hidden border rounded-2xl border-stone-200 dark:border-stone-700">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-stone-400 uppercase tracking-widest">
            ✦ AI Özet
          </span>
          <span className="text-stone-200 dark:text-stone-700">·</span>
          <span className="text-[10px] text-stone-400 uppercase tracking-wider">
            {result.resolvedLanguage}
          </span>
          {result.aiProvider && (
            <>
              <span className="text-stone-200 dark:text-stone-700">·</span>
              <span
                className="text-[10px] text-stone-400"
                title={result.aiModel || ""}>
                {result.aiProvider}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {result.fromCache ? (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              ⚡ Cache
            </span>
          ) : (
            <span className="text-[10px] font-bold text-stone-400">
              ✨ Yeni
            </span>
          )}
          <span className={`text-[10px] font-bold ${confidence.color}`}>
            {confidence.label}
          </span>
          <span className="text-[10px] text-stone-400">
            ~{result.readingTimeMinutes} dk
          </span>
          <button
            onClick={() => fetchSummary(true)}
            title="Yenile"
            className="ml-1 transition-colors text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300">
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

      {/* Body */}
      <div className="p-5 space-y-4 bg-white dark:bg-stone-900">
        <p
          className="text-sm leading-relaxed text-stone-700 dark:text-stone-300"
          style={{ fontFamily: "var(--font-body, Georgia, serif)" }}>
          {result.analysis}
        </p>

        {result.keyPoints?.length > 0 && (
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">
              Önemli Noktalar
            </p>
            <ul className="space-y-2">
              {result.keyPoints.map((pt, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-stone-600 dark:text-stone-400">
                  <span className="w-4 h-4 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[9px] font-black text-stone-500 shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${sentiment.dot}`} />
            <span className={`text-[10px] font-bold ${sentiment.color}`}>
              {sentiment.label} ton
            </span>
          </div>
          <span className="text-[10px] text-stone-400">
            {new Date(result.generatedAt).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-5 py-2.5 bg-stone-50 dark:bg-stone-900/40 border-t border-stone-100 dark:border-stone-800">
        <p className="text-[9px] text-stone-400 dark:text-stone-600 text-center">
          Yapay zeka tarafından otomatik oluşturulmuştur. Doğrulama için kaynak
          haberi okuyunuz.
        </p>
      </div>
    </div>
  );
}
