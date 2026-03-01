"use client";

import { useCallback, useRef, useState } from "react";

const STANCE = {
  neutral: {
    label: "Nötr",
    cls: "text-stone-500 bg-stone-100 dark:bg-stone-800 dark:text-stone-400",
  },
  critical: {
    label: "Eleştirel",
    cls: "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400",
  },
  supportive: {
    label: "Destekçi",
    cls: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  alarmist: {
    label: "Alarmist",
    cls: "text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400",
  },
  optimistic: {
    label: "İyimser",
    cls: "text-sky-600 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-400",
  },
};

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

export default function NewsComparison({ article }) {
  const [state, setState] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fetchingRef = useRef(false); // Effect yerine event-driven fetch

  // fetch_ doğrudan butonlardan / onClick'ten çağrılır — Effect yok
  const fetch_ = useCallback(
    async (force = false) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setState("loading");
      setError("");
      try {
        const res = await window.fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article, forceRefresh: force }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setState(data.error === "no_related" ? "no_related" : "error");
          if (data.error !== "no_related") setError(data.error || "API hatası");
        } else {
          setResult(data);
          setState("success");
        }
      } catch (e) {
        setError(e.message);
        setState("error");
      } finally {
        fetchingRef.current = false;
      }
    },
    [article],
  );

  /* ── Collapsed — tek butona tıkla, fetch başlasın ── */
  if (state === "idle")
    return (
      <button
        onClick={() => fetch_(false)}
        className="flex items-center justify-between w-full px-5 py-4 transition-all border rounded-2xl border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600 group">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center text-xs font-black text-white rounded-full w-7 h-7 bg-stone-900 dark:bg-stone-100 dark:text-stone-900 shrink-0">
            ⚖
          </span>
          <div className="text-left">
            <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
              Kaynak Karşılaştırması
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Farklı kaynaklar bu haberi nasıl aktarıyor?
            </p>
          </div>
        </div>
        <svg
          className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0"
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

  /* ── Loading ── */
  if (state === "loading")
    return (
      <div className="overflow-hidden bg-white border rounded-2xl border-stone-200 dark:border-stone-700 dark:bg-stone-900">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
          <svg
            className="w-4 h-4 text-stone-400 animate-spin shrink-0"
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
          <p className="text-sm font-bold text-stone-600 dark:text-stone-300">
            Kaynaklar Taranıyor
          </p>
          <span className="text-[10px] text-stone-400 ml-auto">
            İlgili haberler karşılaştırılıyor...
          </span>
        </div>
        <div className="p-5 space-y-2.5">
          {[100, 75, 92, 60, 82].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded bg-stone-100 dark:bg-stone-800 animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );

  /* ── No related ── */
  if (state === "no_related")
    return (
      <div className="p-6 text-center bg-white border rounded-2xl border-stone-200 dark:border-stone-700 dark:bg-stone-900">
        <p className="mb-2 text-2xl">🔍</p>
        <p className="mb-1 text-sm font-bold text-stone-700 dark:text-stone-300">
          Karşılaştırılacak Kaynak Yok
        </p>
        <p className="text-xs text-stone-400">
          Bu haber için farklı kaynaklarda ilgili içerik bulunamadı.
        </p>
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
              Karşılaştırma Yapılamadı
            </p>
            <p className="mb-3 text-xs text-red-600 dark:text-red-400">
              {process.env.NODE_ENV === "production"
                ? "Bir sorun oluştu. Lütfen tekrar deneyin."
                : error}
            </p>
            <button
              onClick={() => fetch_(false)}
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
    <div className="overflow-hidden bg-white border rounded-2xl border-stone-200 dark:border-stone-700 dark:bg-stone-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-stone-900 dark:bg-stone-100 flex items-center justify-center text-white dark:text-stone-900 text-[9px] font-black shrink-0">
            ⚖
          </span>
          <span className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest">
            Kaynak Karşılaştırması
          </span>
          <span className="text-stone-200 dark:text-stone-700">·</span>
          <span className="text-[10px] text-stone-400">
            {result.sources?.length} kaynak
          </span>
        </div>
        <div className="flex items-center gap-2">
          {process.env.NODE_ENV !== "production" && result.fromCache && (
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
              ⚡ Cache
            </span>
          )}
          <button
            onClick={() => fetch_(true)}
            title="Yenile"
            className="transition-colors text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300">
            <RefreshIcon />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Kaynaklar */}
        <div>
          {result.searchQuery && (
            <p className="text-[9px] text-stone-400 italic mb-2">
              🔍 &quot;{result.searchQuery}&quot; için aranan
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {result.sources?.map((s, i) => (
              <a
                key={i}
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                           bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700
                           hover:border-stone-400 dark:hover:border-stone-500 transition-colors
                           text-[11px] font-medium text-stone-700 dark:text-stone-300">
                {s.source_icon && (
                  <img
                    src={s.source_icon}
                    className="w-3.5 h-3.5 rounded-full"
                    alt=""
                  />
                )}
                {s.source_name}
                {i === 0 && (
                  <span className="text-[9px] text-stone-400">(orijinal)</span>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Ortak zemin */}
        <div className="p-4 border rounded-xl bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700">
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">
            🤝 Hemfikir Olunanlar
          </p>
          <p className="text-xs leading-relaxed text-stone-700 dark:text-stone-300">
            {result.commonGround}
          </p>
        </div>

        {/* Farklar */}
        {result.differences?.length > 0 && (
          <div>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2.5">
              🔍 Ayrışan Noktalar
            </p>
            <div className="space-y-2">
              {result.differences.map((d, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                  <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 mb-1">
                    {d.aspect}
                  </p>
                  <p className="text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                    {d.analysis}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perspektifler */}
        {result.sourcePerspectives?.length > 0 && (
          <div>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2.5">
              📰 Kaynak Perspektifleri
            </p>
            <div className="space-y-2">
              {result.sourcePerspectives.map((sp, i) => {
                const st = STANCE[sp.stance?.toLowerCase()] ?? STANCE.neutral;
                return (
                  <div
                    key={i}
                    className="p-3 border rounded-xl bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-bold truncate text-stone-800 dark:text-stone-200">
                        {sp.source}
                      </p>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                      {sp.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Genel değerlendirme */}
        <div className="p-4 border rounded-xl bg-stone-900 dark:bg-stone-950 border-stone-700">
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">
            💡 Genel Değerlendirme
          </p>
          <p className="text-xs leading-relaxed text-stone-300">
            {result.overallVerdict}
          </p>
        </div>

        {/* Bias uyarısı */}
        {result.biasWarning && result.biasWarning !== "null" && (
          <div className="p-4 border border-red-100 rounded-xl bg-red-50 dark:bg-red-950/20 dark:border-red-900/60">
            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1.5">
              ⚠ Taraflılık Uyarısı
            </p>
            <p className="text-xs leading-relaxed text-red-700 dark:text-red-300">
              {result.biasWarning}
            </p>
          </div>
        )}

        {/* Kaynak çeşitlilik skoru */}
        {(() => {
          const stances = (result.sourcePerspectives || [])
            .map((s) => s.stance?.toLowerCase())
            .filter(Boolean);
          const uniqueStances = new Set(stances).size;
          const srcCount = result.sources?.length || 1;
          // 0-100: stance çeşitliliği %60 + kaynak sayısı %40
          const diversityScore = Math.round(
            (Math.min(uniqueStances, 5) / 5) * 60 +
              (Math.min(srcCount, 5) / 5) * 40,
          );
          const color =
            diversityScore >= 70
              ? "bg-emerald-500"
              : diversityScore >= 40
                ? "bg-amber-500"
                : "bg-red-500";
          const label =
            diversityScore >= 70
              ? "Yüksek Çeşitlilik"
              : diversityScore >= 40
                ? "Orta Çeşitlilik"
                : "Düşük Çeşitlilik";
          return (
            <div className="p-4 border rounded-xl border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                  🎭 Kaynak Çeşitlilik Skoru
                </p>
                <span className="text-[10px] font-bold text-stone-500">
                  {label} · {diversityScore}/100
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${color}`}
                  style={{ width: `${diversityScore}%` }}
                />
              </div>
              <p className="text-[9px] text-stone-400 mt-1.5">
                {srcCount} kaynak · {uniqueStances || 1} farklı perspektif
              </p>
            </div>
          );
        })()}
      </div>

      <div className="px-5 py-2.5 bg-stone-50 dark:bg-stone-900/40 border-t border-stone-100 dark:border-stone-800">
        <p className="text-[9px] text-stone-400 dark:text-stone-600 text-center">
          Yapay zeka tarafından haber meta verileri kullanılarak otomatik
          oluşturulmuştur.
        </p>
      </div>
    </div>
  );
}
