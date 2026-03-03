"use client";

import { useState } from "react";

const POWER = {
  dominant: {
    label: "Baskın",
    cls: "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  significant: {
    label: "Önemli",
    cls: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  peripheral: {
    label: "Çevre",
    cls: "text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700",
  },
};

const PROB = {
  high: { label: "Yüksek", color: "bg-emerald-500", pct: "80%" },
  medium: { label: "Orta", color: "bg-amber-500", pct: "50%" },
  low: { label: "Düşük", color: "bg-stone-400", pct: "25%" },
};

const TABS = [
  { id: "background", label: "Arka Plan" },
  { id: "actors", label: "Aktörler" },
  { id: "scenarios", label: "Senaryolar" },
  { id: "intel", label: "İstihbarat" },
];

export default function NewsContext({ context }) {
  const [tab, setTab] = useState("background");
  if (!context) return null;

  return (
    <div className="overflow-hidden bg-white border rounded-2xl border-stone-200 dark:border-stone-700 dark:bg-stone-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
        <span className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest">
          ⏳ Bağlam Zinciri
        </span>
        <span className="text-[10px] text-stone-400 uppercase tracking-wider">
          Neden şimdi?
        </span>
      </div>

      {/* One-liner */}
      {context.oneLiner && (
        <div className="px-5 pt-4 pb-3.5 border-b border-stone-100 dark:border-stone-800">
          <p
            className="text-sm italic leading-relaxed text-stone-700 dark:text-stone-300"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
            &quot;{context.oneLiner}&quot;
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-100 dark:border-stone-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-[11px] font-bold transition-colors ${
              tab === t.id
                ? "text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100 -mb-px"
                : "text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* ARKA PLAN */}
        {tab === "background" && (
          <div className="space-y-4">
            {context.whyNow && (
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">
                  ⚡ Neden Şimdi?
                </p>
                <p className="text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                  {context.whyNow}
                </p>
              </div>
            )}
            {context.timeline?.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-4">
                  📅 Kronoloji
                </p>
                <div className="relative pl-1 space-y-4">
                  <div className="absolute left-[11px] top-0 bottom-0 w-px bg-stone-200 dark:bg-stone-700" />
                  {context.timeline.map((item, i) => {
                    const isLast = i === context.timeline.length - 1;
                    return (
                      <div key={i} className="relative flex gap-4">
                        <div
                          className={`w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center z-10 ${
                            isLast
                              ? "bg-stone-900 dark:bg-stone-100 ring-2 ring-stone-200 dark:ring-stone-700"
                              : "bg-white dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-600"
                          }`}>
                          {isLast && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-stone-900" />
                          )}
                        </div>
                        <div className="flex-1 pb-1">
                          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                            {item.period}
                          </span>
                          <p className="text-xs font-bold text-stone-800 dark:text-stone-100 mt-0.5 mb-0.5 leading-snug">
                            {item.event}
                          </p>
                          <p className="text-[11px] text-stone-400 dark:text-stone-500 italic">
                            → {item.relevance}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {context.rootCause && (
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">
                  🔎 Temel Neden
                </p>
                <p className="text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                  {context.rootCause}
                </p>
              </div>
            )}
          </div>
        )}

        {/* AKTÖRLER */}
        {tab === "actors" && (
          <div className="space-y-2.5">
            {context.keyActors?.map((actor, i) => {
              const p = POWER[actor.powerLevel] ?? POWER.peripheral;
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="flex items-center justify-center text-xs font-black rounded-full w-7 h-7 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 shrink-0">
                      {actor.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {actor.name}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${p.cls}`}>
                      {p.label}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400">
                      {actor.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed pl-9">
                    {actor.interest}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* SENARYOLAR */}
        {tab === "scenarios" && (
          <div className="space-y-3">
            {context.scenarios?.map((s, i) => {
              const p = PROB[s.probability] ?? PROB.medium;
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-stone-800 dark:text-stone-100">
                      {s.label}
                    </p>
                    <span className="text-[9px] font-black text-stone-400 uppercase">
                      {p.label}
                    </span>
                  </div>
                  <div className="h-1 mb-3 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                    <div
                      className={`h-full rounded-full ${p.color}`}
                      style={{ width: p.pct, transition: "width 0.8s ease" }}
                    />
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-2.5">
                    {s.description}
                  </p>
                  {s.indicator && (
                    <div className="flex items-start gap-1.5 pt-2.5 border-t border-stone-200 dark:border-stone-700">
                      <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase shrink-0 mt-0.5 tracking-wider">
                        İzle
                      </span>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
                        {s.indicator}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* İSTİHBARAT */}
        {tab === "intel" && (
          <div className="space-y-4">
            {context.terminology?.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2.5">
                  📚 Terimler
                </p>
                <div className="space-y-1.5">
                  {context.terminology.map((t, i) => (
                    <div
                      key={i}
                      className="p-3 border rounded-xl bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700">
                      <p className="text-[11px] font-black text-stone-700 dark:text-stone-200 mb-1 italic">
                        {t.term}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                        {t.definition}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {context.biggerPicture && (
              <div className="p-3.5 rounded-xl bg-stone-900 dark:bg-stone-950 border border-stone-700">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">
                  🌍 Büyük Resim
                </p>
                <p className="text-xs leading-relaxed text-stone-300">
                  {context.biggerPicture}
                </p>
              </div>
            )}
            {(context.relatedTopics ?? context.relatedStories)?.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2.5">
                  🔗 Takip Edilmeli
                </p>
                <div className="space-y-1.5">
                  {(context.relatedTopics ?? context.relatedStories).map(
                    (s, i) => (
                      <div
                        key={i}
                        className="p-3 border rounded-xl bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700">
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-200 mb-0.5">
                          {s.topic ?? s.title}
                        </p>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 italic">
                          {s.whyFollow ?? s.connection}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
