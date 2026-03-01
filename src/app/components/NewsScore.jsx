"use client";

import { useState } from "react";

const VERDICT = {
  reliable: {
    label: "Güvenilir",
    color: "text-emerald-600 dark:text-emerald-400",
    ring: "#10b981",
    accent: "border-emerald-300 dark:border-emerald-700",
  },
  questionable: {
    label: "Şüpheli",
    color: "text-amber-600 dark:text-amber-400",
    ring: "#f59e0b",
    accent: "border-amber-300 dark:border-amber-700",
  },
  unreliable: {
    label: "Güvenilmez",
    color: "text-red-600 dark:text-red-400",
    ring: "#ef4444",
    accent: "border-red-300 dark:border-red-700",
  },
};

const SCORE_META = {
  reliability: { label: "Güvenilirlik", icon: "🔍" },
  neutrality: { label: "Tarafsızlık", icon: "⚖️" },
  emotionalLanguage: { label: "Duygusal Dil", icon: "🎭" },
  sourceReputation: { label: "Kaynak İtibarı", icon: "🏛️" },
};

function ScoreCircle({ score, verdict }) {
  const v = VERDICT[verdict] ?? VERDICT.questionable;
  const r = 38,
    circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          strokeWidth="6"
          stroke="currentColor"
          className="text-stone-100 dark:text-stone-800"
        />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          strokeWidth="6"
          stroke={v.ring}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black leading-none text-stone-900 dark:text-stone-50 tabular-nums">
          {score}
        </span>
        <span
          className={`text-[8px] font-black uppercase tracking-wider mt-0.5 ${v.color}`}>
          {v.label}
        </span>
      </div>
    </div>
  );
}

function ScoreBar({ name, value }) {
  const meta = SCORE_META[name] ?? { label: name, icon: "·" };
  const isInv = name === "emotionalLanguage";
  const display = isInv ? 100 - value : value;
  const color =
    display >= 70
      ? "bg-emerald-500"
      : display >= 40
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 text-xs leading-none text-center shrink-0">
        {meta.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            {meta.label}
          </span>
          <span className="text-[11px] font-black tabular-nums text-stone-700 dark:text-stone-300">
            {value}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
          <div
            className={`h-full rounded-full ${color} transition-all duration-700`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Genel" },
  { id: "flags", label: "Uyarılar" },
  { id: "deep", label: "Derin Analiz" },
];

export default function NewsScore({ score }) {
  const [tab, setTab] = useState("overview");
  if (!score) return null;

  const v = VERDICT[score.verdict] ?? VERDICT.questionable;
  const hasDeep =
    score.manipulationTactics?.length ||
    score.missingContext?.length ||
    score.factCheckSuggestions?.length;
  const visibleTabs = TABS.filter((t) => t.id !== "deep" || hasDeep);

  return (
    <div className="overflow-hidden bg-white border rounded-2xl border-stone-200 dark:border-stone-700 dark:bg-stone-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: v.ring }}
          />
          <span className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest">
            Güvenilirlik Analizi
          </span>
        </div>
        <div className="flex items-center gap-2">
          {score.clickbaitScore > 0 && (
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                score.clickbaitScore > 60
                  ? "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                  : score.clickbaitScore > 30
                    ? "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                    : "text-stone-500 border-stone-200 dark:border-stone-700"
              }`}>
              Clickbait {score.clickbaitScore}
            </span>
          )}
          <span className={`text-[11px] font-bold ${v.color}`}>{v.label}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-100 dark:border-stone-800">
        {visibleTabs.map((t) => (
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
        {/* GENEL */}
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <ScoreCircle score={score.overallScore} verdict={score.verdict} />
              <p className="flex-1 pt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                {score.summary}
              </p>
            </div>
            <div className="pt-1 space-y-3 border-t border-stone-100 dark:border-stone-800">
              {Object.entries(score.scores || {}).map(([k, v]) => (
                <ScoreBar key={k} name={k} value={v} />
              ))}
            </div>
          </div>
        )}

        {/* UYARILAR */}
        {tab === "flags" && (
          <div className="space-y-4">
            {score.redFlags?.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2.5">
                  🚩 Uyarılar
                </p>
                <div className="space-y-1.5">
                  {score.redFlags.map((f, i) => (
                    <div
                      key={i}
                      className="flex gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/60">
                      <span className="text-red-400 text-[10px] font-black shrink-0 mt-0.5">
                        ✕
                      </span>
                      <p className="text-xs leading-relaxed text-red-700 dark:text-red-300">
                        {f}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {score.greenFlags?.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2.5">
                  ✓ Olumlu Sinyaller
                </p>
                <div className="space-y-1.5">
                  {score.greenFlags.map((f, i) => (
                    <div
                      key={i}
                      className="flex gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60">
                      <span className="text-emerald-500 text-[10px] font-black shrink-0 mt-0.5">
                        ✓
                      </span>
                      <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
                        {f}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!score.redFlags?.length && !score.greenFlags?.length && (
              <p className="py-4 text-xs text-center text-stone-400">
                Uyarı bulunamadı
              </p>
            )}
          </div>
        )}

        {/* DERİN ANALİZ */}
        {tab === "deep" && (
          <div className="space-y-5">
            {score.manipulationTactics?.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2.5">
                  🎯 Manipülasyon Taktikleri
                </p>
                <div className="space-y-1.5">
                  {score.manipulationTactics.map((t, i) => (
                    <div
                      key={i}
                      className="p-3 border border-orange-100 rounded-xl bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/60">
                      <p className="text-xs leading-relaxed text-orange-800 dark:text-orange-300">
                        {t}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {score.missingContext?.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2.5">
                  🕳 Eksik Bağlam
                </p>
                <div className="space-y-1.5">
                  {score.missingContext.map((m, i) => (
                    <div
                      key={i}
                      className="flex gap-2.5 p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                      <span className="text-xs font-black text-stone-400 shrink-0">
                        ?
                      </span>
                      <p className="text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                        {m}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {score.factCheckSuggestions?.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2.5">
                  🔬 Doğrulanabilir İddialar
                </p>
                <div className="space-y-1.5">
                  {score.factCheckSuggestions.map((f, i) => (
                    <div
                      key={i}
                      className="flex gap-2.5 p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                      <span className="text-stone-500 text-[10px] font-black shrink-0 tabular-nums mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                        {f}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
