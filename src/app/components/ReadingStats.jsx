"use client";

import { useReadingStats } from "@/app/lib/useReadingStats";

const CAT_LABELS = {
  technology: "Teknoloji",
  sports: "Spor",
  business: "Ekonomi",
  health: "Sağlık",
  entertainment: "Magazin",
  politics: "Politika",
  world: "Dünya",
  science: "Bilim",
  environment: "Çevre",
  crime: "Suç",
  other: "Diğer",
};

function StatBox({ label, value, sub }) {
  return (
    <div className="flex-1 min-w-0 px-4 py-3.5 text-center">
      <p
        className="text-2xl font-black text-stone-900 dark:text-white"
        style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
        {value}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mt-0.5">
        {label}
      </p>
      {sub && (
        <p className="text-[9px] text-stone-400 dark:text-stone-600 mt-0.5">
          {sub}
        </p>
      )}
    </div>
  );
}

function MiniBar({ count, max, label }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span className="text-[9px] font-bold text-stone-500 dark:text-stone-400">
        {count || ""}
      </span>
      <div
        className="w-full bg-stone-100 dark:bg-stone-800 rounded-full"
        style={{ height: 40 }}>
        <div
          className="w-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all duration-500"
          style={{
            height: `${Math.max(pct, count > 0 ? 8 : 0)}%`,
            marginTop: `${100 - Math.max(pct, count > 0 ? 8 : 0)}%`,
          }}
        />
      </div>
      <span className="text-[9px] text-stone-400 dark:text-stone-600">
        {label}
      </span>
    </div>
  );
}

export default function ReadingStats() {
  const { stats, mounted } = useReadingStats();

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-stone-100 dark:bg-stone-800 rounded-xl" />
        <div className="h-16 bg-stone-100 dark:bg-stone-800 rounded-xl" />
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="py-8 text-center text-stone-400 dark:text-stone-500">
        <p className="text-2xl mb-2">📖</p>
        <p className="text-xs">Henüz hiç haber okumadın.</p>
        <p className="text-[10px] mt-1 text-stone-400">
          Her haber tıkladığında burası güncellenir.
        </p>
      </div>
    );
  }

  const maxDaily = Math.max(...stats.dailyBreakdown.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      {/* Ana sayaçlar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
        <div className="flex divide-x divide-stone-100 dark:divide-stone-800">
          <StatBox label="Toplam" value={stats.total} sub="haber okundu" />
          <StatBox label="Bugün" value={stats.todayCount} sub="haber" />
          <StatBox
            label="Bu Hafta"
            value={stats.weekCount}
            sub={`ort. ${stats.avgPerDay}/gün`}
          />
          <StatBox
            label="Seri"
            value={`${stats.streak}🔥`}
            sub={stats.streak > 1 ? "gün üst üste" : "gün"}
          />
        </div>
      </div>

      {/* Favori kategori + tahmini süre */}
      <div className="flex gap-3">
        {stats.favoriteCategory && (
          <div className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">
              Favori Kategori
            </p>
            <p className="text-sm font-black text-stone-900 dark:text-white">
              {CAT_LABELS[stats.favoriteCategory] ?? stats.favoriteCategory}
            </p>
            <p className="text-[9px] text-stone-400 mt-0.5">
              bu hafta {stats.favoriteCategoryCount} haber
            </p>
          </div>
        )}
        <div className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">
            Tahmini Süre
          </p>
          <p className="text-sm font-black text-stone-900 dark:text-white">
            {stats.estimatedMinutes >= 60
              ? `${Math.floor(stats.estimatedMinutes / 60)}s ${stats.estimatedMinutes % 60}dk`
              : `${stats.estimatedMinutes} dk`}
          </p>
          <p className="text-[9px] text-stone-400 mt-0.5">
            toplam okuma süresi
          </p>
        </div>
      </div>

      {/* Son 7 gün bar chart */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">
          Son 7 Gün
        </p>
        <div className="flex items-end gap-1.5 h-12">
          {stats.dailyBreakdown.map((d) => (
            <MiniBar
              key={d.label}
              count={d.count}
              max={maxDaily}
              label={d.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
