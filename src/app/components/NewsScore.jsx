"use client";
// components/NewsScore.jsx

const VERDICT_CONFIG = {
  reliable: {
    label: "Güvenilir",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  questionable: {
    label: "Şüpheli",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  unreliable: {
    label: "Güvenilmez",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    dot: "bg-red-500",
  },
};

const SCORE_LABELS = {
  reliability: "Güvenilirlik",
  neutrality: "Tarafsızlık",
  emotionalLanguage: "Duygusal Dil",
  sourceReputation: "Kaynak İtibarı",
};

// Skora göre renk
function scoreColor(value, invert = false) {
  const v = invert ? 100 - value : value;
  if (v >= 70) return "bg-emerald-500";
  if (v >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function ScoreBar({ label, value, invert = false }) {
  const displayValue = invert ? 100 - value : value; // emotionalLanguage'da düşük = iyi
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {label}
        </span>
        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
          {value}
        </span>
      </div>
      <div className="h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-700 ${scoreColor(displayValue)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Dairesel skor göstergesi
function ScoreCircle({ score, verdict }) {
  const cfg = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.questionable;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  const strokeColor =
    verdict === "reliable"
      ? "#10b981"
      : verdict === "questionable"
        ? "#f59e0b"
        : "#ef4444";

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-700"
          strokeWidth="8"
        />
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black leading-none text-gray-900 dark:text-white">
          {score}
        </span>
        <span className={`text-[10px] font-bold ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

export default function NewsScore({ score }) {
  if (!score) return null;

  const cfg = VERDICT_CONFIG[score.verdict] || VERDICT_CONFIG.questionable;

  return (
    <div className={`rounded-2xl border ${cfg.bg} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-inherit">
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          Güvenilirlik Skoru
        </p>
        <span className={`ml-auto text-xs font-bold ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      <div className="p-6">
        {/* Üst kısım: daire + özet */}
        <div className="flex items-start gap-5 mb-6">
          <ScoreCircle score={score.overallScore} verdict={score.verdict} />
          <p className="pt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {score.summary}
          </p>
        </div>

        {/* Alt skorlar */}
        <div className="mb-6 space-y-3">
          {Object.entries(score.scores || {}).map(([key, val]) => (
            <ScoreBar
              key={key}
              label={SCORE_LABELS[key] || key}
              value={val}
              invert={key === "emotionalLanguage"}
            />
          ))}
        </div>

        {/* Red & Green flags */}
        <div className="grid grid-cols-2 gap-3">
          {score.redFlags?.length > 0 && (
            <div className="p-3 border border-red-200 rounded-xl bg-red-50 dark:bg-red-950/30 dark:border-red-900">
              <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
                🚩 Uyarılar
              </p>
              <ul className="space-y-1">
                {score.redFlags.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1 text-xs text-red-700 dark:text-red-300">
                    <span className="shrink-0 mt-0.5">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {score.greenFlags?.length > 0 && (
            <div className="p-3 border rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                ✅ Olumlu
              </p>
              <ul className="space-y-1">
                {score.greenFlags.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                    <span className="shrink-0 mt-0.5">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
