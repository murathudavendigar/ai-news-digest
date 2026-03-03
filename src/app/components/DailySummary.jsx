"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const MOOD_CONFIG = {
  tense: {
    label: "Gergin",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    dot: "bg-red-500",
  },
  hopeful: {
    label: "Umut Var",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    dot: "bg-emerald-500",
  },
  turbulent: {
    label: "Çalkantılı",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    dot: "bg-orange-500",
  },
  calm: {
    label: "Sakin",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    dot: "bg-sky-500",
  },
  critical: {
    label: "Kritik",
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-50 dark:bg-red-900/20",
    dot: "bg-red-600",
  },
  uncertain: {
    label: "Belirsiz",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    dot: "bg-amber-500",
  },
  positive: {
    label: "Olumlu",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    dot: "bg-emerald-500",
  },
};

const IMPACT_COLORS = {
  critical: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  high: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
};

// Veri yoksa zarif skeleton
function Skeleton() {
  return (
    <div className="mb-10 overflow-hidden bg-white border rounded-2xl border-stone-200 dark:border-stone-700 dark:bg-stone-900">
      <div className="pt-6 pb-5 space-y-3 border-b px-7 border-stone-100 dark:border-stone-800 animate-pulse">
        <div className="h-2.5 bg-stone-100 dark:bg-stone-800 rounded w-1/4" />
        <div className="w-3/4 rounded h-7 bg-stone-200 dark:bg-stone-700" />
        <div className="w-1/2 h-4 rounded bg-stone-100 dark:bg-stone-800" />
        <div className="space-y-1.5 pt-1">
          <div className="w-full h-3 rounded bg-stone-100 dark:bg-stone-800" />
          <div className="w-5/6 h-3 rounded bg-stone-100 dark:bg-stone-800" />
        </div>
      </div>
      <div className="flex items-center justify-between py-4 px-7">
        <div className="w-32 h-3 rounded bg-stone-100 dark:bg-stone-800 animate-pulse" />
        <div className="w-24 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 animate-pulse" />
      </div>
    </div>
  );
}

// ── Ana component — prop olarak veri alır ─────────────────────────────────
export default function DailySummary({ data }) {
  // Başlangıçta SSR'dan gelen marketi kullan, mount sonrası taze veriyi çek
  const [markets, setMarkets] = useState(data?.markets ?? null);
  // Mobilde detaylar başta gizli; kullanıcı isteğiyle açılır
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && !d.error && setMarkets(d))
      .catch(() => {});
  }, []);

  if (!data) return <Skeleton />;

  const mood = MOOD_CONFIG[data.dayMood] || MOOD_CONFIG.uncertain;
  const mustRead = (data.mustRead || []).slice(0, 3);

  return (
    <div className="mb-10">
      {/* Üst bant */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${mood.dot} animate-pulse`} />
          <span className="text-xs font-bold tracking-widest uppercase text-stone-500 dark:text-stone-400">
            Günün Özeti
          </span>
          <span className="text-stone-300 dark:text-stone-600">·</span>
          <span className="text-xs text-stone-400 dark:text-stone-500">
            {data.date}
          </span>
          {data.issueNumber && (
            <>
              <span className="text-stone-300 dark:text-stone-600">·</span>
              <span className="text-xs text-stone-400 dark:text-stone-500">
                Sayı {data.issueNumber}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${mood.bg} ${mood.color}`}>
            {mood.label}
          </span>
          <Link
            href="/summary"
            className="flex items-center gap-1 text-xs font-semibold transition-colors text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white group">
            Tam baskı
            <svg
              className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
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
          </Link>
        </div>
      </div>

      {/* Kart */}
      <div className="overflow-hidden transition-shadow bg-white border shadow-sm rounded-2xl border-stone-200 dark:border-stone-700 dark:bg-stone-900 hover:shadow-md">
        {/* Manşet */}
        <div className="pb-5 border-b px-7 pt-7 border-stone-100 dark:border-stone-800">
          <h2
            className="mb-2 text-2xl font-black leading-tight md:text-3xl text-stone-900 dark:text-stone-50"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
            {data.headline}
          </h2>
          {data.subheadline && (
            <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
              {data.subheadline}
            </p>
          )}
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300 sm:line-clamp-3 line-clamp-2">
            {data.intro}
          </p>
        </div>

        {/* Mutlaka Oku */}
        {mustRead.length > 0 && (
          <div className="py-5 border-b px-7 border-stone-100 dark:border-stone-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-4">
              Mutlaka Oku
            </p>
            <div className="space-y-3 sm:space-y-4">
              {mustRead.map((story, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 sm:gap-4${
                    i >= 2 ? (expanded ? "" : " hidden sm:flex") : ""
                  }`}>
                  <span
                    className="text-2xl font-black leading-none text-stone-200 dark:text-stone-700 w-7 shrink-0"
                    style={{
                      fontFamily: "var(--font-display, Georgia, serif)",
                    }}>
                    {story.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-bold leading-snug text-stone-800 dark:text-stone-100">
                        {story.title}
                      </p>
                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${IMPACT_COLORS[story.impact] || IMPACT_COLORS.high}`}>
                        {story.impact === "critical" ? "Kritik" : "Önemli"}
                      </span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed text-stone-500 dark:text-stone-400${
                        expanded ? "" : " hidden sm:block"
                      }`}>
                      {story.why}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bölümler — mobilde varsayılan gizli, expanded veya md+ görünür */}
        {data.sections?.length > 0 && (
          <div
            className={`${
              expanded ? "grid" : "hidden md:grid"
            } grid-cols-1 border-b divide-y md:grid-cols-2 md:divide-y-0 md:divide-x divide-stone-100 dark:divide-stone-800 border-stone-100 dark:border-stone-800`}>
            {data.sections.slice(0, 4).map((s, i) => (
              <div key={i} className="px-6 py-5">
                <div className="flex items-center gap-2 mb-2">
                  <span>{s.emoji}</span>
                  <p className="text-xs font-bold tracking-wider uppercase text-stone-500 dark:text-stone-400">
                    {s.title}
                  </p>
                </div>
                {s.headline && (
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 mb-1.5 leading-snug">
                    {s.headline}
                  </p>
                )}
                <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400 line-clamp-2">
                  {s.summary}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Mobil genişlet / daralt toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="sm:hidden w-full py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 border-t border-stone-100 dark:border-stone-800 transition-colors">
          {expanded ? (
            <>
              <span>Daha Az</span>
              <span className="text-[8px]">▴</span>
            </>
          ) : (
            <>
              <span>Tüm İçerik</span>
              <span className="text-[8px]">▾</span>
            </>
          )}
        </button>

        {/* Alt bant: sayı + kavram + piyasalar + CTA */}
        <div className="flex flex-col divide-y sm:flex-row sm:divide-y-0 sm:divide-x divide-stone-100 dark:divide-stone-800">
          {data.numberofDay && (
            <div
              className={`flex-1 px-5 py-3.5${expanded ? "" : " hidden sm:block"}`}>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">
                Günün Sayısı
              </p>
              <span
                className="text-xl font-black text-stone-800 dark:text-stone-100"
                style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
                {data.numberofDay.figure}
              </span>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 line-clamp-1">
                {data.numberofDay.context}
              </p>
            </div>
          )}
          {data.wordOfDay && (
            <div
              className={`flex-1 px-5 py-3.5${expanded ? "" : " hidden sm:block"}`}>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">
                Kavram
              </p>
              <span
                className="text-sm italic font-black text-stone-800 dark:text-stone-100"
                style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
                {data.wordOfDay.word}
              </span>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 line-clamp-1">
                {data.wordOfDay.definition}
              </p>
            </div>
          )}
          {markets?.usdTry && markets.usdTry !== "—" && (
            <div
              className={`flex-1 px-5 py-3.5${expanded ? "" : " hidden sm:block"}`}>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                Piyasalar
              </p>
              <div className="flex items-center gap-2 text-xs">
                {markets.bist100 && markets.bist100 !== "—" && (
                  <span className="font-bold text-stone-700 dark:text-stone-300">
                    BIST {markets.bist100}
                  </span>
                )}
                {markets.usdTry && markets.usdTry !== "—" && (
                  <span className="text-stone-500">$ {markets.usdTry}</span>
                )}
                {markets.eurTry && markets.eurTry !== "—" && (
                  <span className="text-stone-500">€ {markets.eurTry}</span>
                )}
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800"></div>
            </div>
          )}
          <div className="flex-1 px-5 py-3.5 flex items-center justify-between sm:justify-end">
            <p className="text-[10px] text-stone-400 sm:hidden">
              {data.articleCount} haber
            </p>
            <Link
              href="/summary"
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">
              Tam Baskı
              <svg
                className="w-3.5 h-3.5"
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
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
