"use client";

import { useEffect, useState } from "react";
import { getCategoryStats, getTopCategories } from "@/app/lib/categoryStats";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/app/lib/categoryConfig";

export default function ReadingStatsWidget({ compact = false }) {
  const [stats, setStats] = useState({ topCategories: [], totalWeekReads: 0, totalWeekMinutes: 0 });
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (compact) {
      const isDismissed = localStorage.getItem('haberai_dismiss_stats_hint') === 'true';
      setDismissed(isDismissed);
    }

    const loadStats = () => {
      try {
        const topCats = getTopCategories(3);
        const history = JSON.parse(localStorage.getItem('haberai_reading_history') || '[]');
        
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        let weekReads = 0;
        let weekSeconds = 0;
        
        history.forEach(entry => {
          if (new Date(entry.readAt) >= oneWeekAgo) {
            weekReads++;
            weekSeconds += (entry.secondsSpent || 0);
          }
        });
        
        setStats({
          topCategories: topCats,
          totalWeekReads: weekReads,
          totalWeekMinutes: Math.ceil(weekSeconds / 60)
        });
      } catch (e) {
        console.error("Stats load err:", e);
      }
    };

    loadStats();
    
    const handleUpdate = () => loadStats();
    window.addEventListener("haberai_reading_stats_updated", handleUpdate);
    window.addEventListener("haberai_category_stats_updated", handleUpdate);
    
    return () => {
      window.removeEventListener("haberai_reading_stats_updated", handleUpdate);
      window.removeEventListener("haberai_category_stats_updated", handleUpdate);
    };
  }, [compact]);

  const handleDismiss = () => {
    localStorage.setItem('haberai_dismiss_stats_hint', 'true');
    setDismissed(true);
  };

  if (!mounted) return null;

  if (compact) {
    if (dismissed || stats.topCategories.length === 0) return null;
    const topCat = stats.topCategories[0].category;
    const topCatLabel = CATEGORY_LABELS[topCat.toLowerCase()] || topCat;
    
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3 mx-4 mb-4 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 rounded-xl border border-amber-200/50 dark:border-amber-900/40 shadow-sm text-sm">
        <div className="flex items-center gap-2">
          <span>✨</span>
          <p className="font-medium leading-snug">
            En çok <strong className="font-black">{topCatLabel}</strong> okuyorsun — <strong>Senin İçin</strong> sekmesini dene!
          </p>
        </div>
        <button onClick={handleDismiss} className="p-1 shrink-0 opacity-60 hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  // Full widget
  const maxReads = stats.topCategories.length > 0 ? stats.topCategories[0].totalReads : 1;

  return (
    <div className="p-5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
      <h3 className="text-lg font-black text-stone-900 dark:text-white mb-4" style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
        Okuma Alışkanlıkların
      </h3>
      
      <div className="flex gap-6 mb-6">
        <div className="flex-1 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl text-center">
          <p className="text-3xl font-black mb-1">{stats.totalWeekReads}</p>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Haftalık Haber</p>
        </div>
        <div className="flex-1 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl text-center">
          <p className="text-3xl font-black mb-1">{stats.totalWeekMinutes}</p>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Dakika</p>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4">En Çok Okunan Kategoriler</h4>
        {stats.topCategories.length === 0 ? (
          <p className="text-sm text-stone-400">Henüz yeterli veri yok.</p>
        ) : (
          <div className="space-y-3">
            {stats.topCategories.map((data, idx) => {
              const label = CATEGORY_LABELS[data.category.toLowerCase()] || data.category;
              const colorCls = CATEGORY_COLORS[data.category.toLowerCase()] || "bg-stone-500";
              const percent = Math.max(5, Math.round((data.totalReads / maxReads) * 100)); // min 5% width
              
              return (
                <div key={data.category} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs font-bold text-stone-700 dark:text-stone-300 truncate">
                    {label}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div className={`h-full rounded-full ${colorCls}`} style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-xs font-black text-right text-stone-500">
                    {data.totalReads}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
