"use client";

import { useCallback, useEffect, useState } from "react";

const STANCE_CONFIG = {
  neutral: {
    label: "Nötr",
    color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
  },
  critical: {
    label: "Eleştirel",
    color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  },
  supportive: {
    label: "Destekçi",
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  },
  alarmist: {
    label: "Alarmist",
    color:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  },
  optimistic: {
    label: "İyimser",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  },
};

export default function NewsComparison({ article }) {
  const [state, setState] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const fetchComparison = useCallback(
    async (forceRefresh = false) => {
      setState("loading");
      setError("");

      try {
        const res = await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article, forceRefresh }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          if (data.error === "no_related") {
            setState("no_related");
          } else {
            throw new Error(data.error || "API hatası");
          }
          return;
        }

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
    if (expanded && state === "idle") {
      fetchComparison();
    }
  }, [expanded, state, fetchComparison]);

  // ── Collapsed trigger button ──────────────────────────────────────────────
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center justify-between w-full px-6 py-4 transition-colors border rounded-2xl border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 group">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-amber-500">
            ⚖
          </span>
          <div className="text-left">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
              Kaynak Karşılaştırması
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Farklı kaynaklar bu haberi nasıl aktarıyor?
            </p>
          </div>
        </div>
        <svg
          className="w-5 h-5 transition-transform text-amber-500 group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="p-6 border rounded-2xl border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500">
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
            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
              Kaynaklar Taranıyor
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              İlgili haberler aranıyor ve karşılaştırılıyor...
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {[100, 75, 90, 60, 80].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded-full bg-amber-200 dark:bg-amber-800 animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── No related ────────────────────────────────────────────────────────────
  if (state === "no_related") {
    return (
      <div className="p-6 text-center border rounded-2xl border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
        <span className="text-3xl">🔍</span>
        <p className="mt-2 mb-1 font-bold text-amber-800 dark:text-amber-300">
          Karşılaştırılacak Kaynak Bulunamadı
        </p>
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Bu haber için farklı kaynaklarda ilgili içerik tespit edilemedi.
        </p>
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
              Karşılaştırma Yapılamadı
            </p>
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
            <button
              onClick={() => fetchComparison(false)}
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
      <div className="overflow-hidden border rounded-2xl border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center text-xs font-bold text-white rounded-full w-7 h-7 bg-amber-500">
              ⚖
            </span>
            <div>
              <p className="text-sm font-bold leading-none text-amber-900 dark:text-amber-100">
                Kaynak Karşılaştırması
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 uppercase tracking-wider">
                Groq · {result.sources?.length} kaynak · NewsData + NewsAPI.org
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result.fromCache && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                ⚡ Cache
              </span>
            )}
            <button
              onClick={() => fetchComparison(true)}
              title="Yenile"
              className="transition-colors text-amber-400 hover:text-amber-600">
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

        <div className="p-6 space-y-6">
          {/* Compared Sources */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400">
                Karşılaştırılan Kaynaklar
              </p>
              {result.searchQuery && (
                <span className="text-[10px] text-amber-500 dark:text-amber-500 italic">
                  🔍 &quot;{result.searchQuery}&quot;
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {result.sources?.map((s, i) => (
                <a
                  key={i}
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-800 hover:border-amber-400 transition-colors text-xs font-medium text-gray-700 dark:text-gray-300">
                  {s.source_icon && (
                    <img
                      src={s.source_icon}
                      className="w-4 h-4 rounded-full"
                      alt=""
                    />
                  )}
                  {s.source_name}
                  {i === 0 && (
                    <span className="text-[10px] text-amber-500 font-bold">
                      (orijinal)
                    </span>
                  )}
                  {s.provider === "newsapi" && (
                    <span className="text-[10px] text-blue-500 font-bold">
                      🌐
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Common Ground */}
          <div className="p-4 bg-white border rounded-xl dark:bg-gray-800 border-amber-100 dark:border-amber-900">
            <p className="mb-2 text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400">
              🤝 Tüm Kaynakların Hemfikir Olduğu
            </p>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {result.commonGround}
            </p>
          </div>

          {/* Differences */}
          {result.differences?.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400">
                🔍 Kaynakların Ayrıştığı Noktalar
              </p>
              <div className="space-y-3">
                {result.differences.map((diff, i) => (
                  <div
                    key={i}
                    className="p-4 bg-white border rounded-xl dark:bg-gray-800 border-amber-100 dark:border-amber-900">
                    <p className="mb-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                      {diff.aspect}
                    </p>
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {diff.analysis}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Perspectives */}
          {result.sourcePerspectives?.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400">
                📰 Kaynak Perspektifleri
              </p>
              <div className="space-y-2">
                {result.sourcePerspectives.map((sp, i) => {
                  const stance =
                    STANCE_CONFIG[sp.stance?.toLowerCase()] ||
                    STANCE_CONFIG.neutral;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-white border rounded-xl dark:bg-gray-800 border-amber-100 dark:border-amber-900">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-bold text-gray-800 truncate dark:text-gray-200">
                            {sp.source}
                          </p>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${stance.color}`}>
                            {stance.label}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                          {sp.note}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Overall Verdict */}
          <div className="p-4 border rounded-xl bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800">
            <p className="mb-2 text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-300">
              💡 Genel Değerlendirme
            </p>
            <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
              {result.overallVerdict}
            </p>
          </div>

          {/* Bias Warning */}
          {result.biasWarning && result.biasWarning !== "null" && (
            <div className="p-4 border border-red-200 rounded-xl bg-red-50 dark:bg-red-950/30 dark:border-red-800">
              <p className="mb-1 text-xs font-bold tracking-wider text-red-600 uppercase dark:text-red-400">
                ⚠️ Taraflılık Uyarısı
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {result.biasWarning}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-amber-100/50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800">
          <p className="text-[10px] text-amber-500 text-center">
            Bu karşılaştırma yapay zeka tarafından mevcut haber meta verileri
            kullanılarak otomatik oluşturulmuştur.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
