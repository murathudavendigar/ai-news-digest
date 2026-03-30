"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/app/lib/categoryConfig";
import ReadingStatsWidget from "@/app/components/ReadingStatsWidget";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ weekCount: 0, weekMinutes: 0, topCategory: null });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const loadHistory = () => {
      try {
        const raw = JSON.parse(localStorage.getItem('haberai_reading_history') || '[]');
        setHistory(raw);
        
        // Calculate week stats
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        let weekCount = 0;
        let weekSeconds = 0;
        const categoryCounts = {};
        
        raw.forEach(entry => {
          const d = new Date(entry.readAt);
          if (d >= oneWeekAgo) {
            weekCount++;
            weekSeconds += (entry.secondsSpent || 0);
          }
          if (entry.category) {
            const catStr = Array.isArray(entry.category) ? entry.category[0] : entry.category;
            if (catStr) {
              categoryCounts[catStr] = (categoryCounts[catStr] || 0) + 1;
            }
          }
        });
        
        let topCategory = null;
        let maxRuns = 0;
        Object.entries(categoryCounts).forEach(([cat, count]) => {
          if (count > maxRuns) {
            maxRuns = count;
            topCategory = cat;
          }
        });
        
        setStats({
          weekCount,
          weekMinutes: Math.ceil(weekSeconds / 60),
          topCategory: topCategory ? CATEGORY_LABELS[topCategory.toLowerCase()] || topCategory : "Yok"
        });
        
      } catch {
        setHistory([]);
      }
    };

    loadHistory();
    
    const handleStorageUpdate = () => loadHistory();
    window.addEventListener("haberai_reading_stats_updated", handleStorageUpdate);
    
    return () => {
      window.removeEventListener("haberai_reading_stats_updated", handleStorageUpdate);
    };
  }, []);

  const handleClearHistory = () => {
    if (confirm("Tüm okuma geçmişinizi silmek istediğinize emin misiniz?")) {
      localStorage.removeItem("haberai_reading_history");
      setHistory([]);
      setStats({ weekCount: 0, weekMinutes: 0, topCategory: null });
      window.dispatchEvent(new Event("haberai_reading_stats_updated"));
    }
  };

  const groupedByDay = history.reduce((acc, entry) => {
    const dateStr = new Date(entry.readAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(entry);
    return acc;
  }, {});

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-stone-900 dark:text-white mb-6" style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
          Okuma Geçmişim
        </h1>
        
        {/* Stats Widget */}
        <div className="mb-10">
          <ReadingStatsWidget />
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-6 opacity-30">📖</div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
              Henüz okuma geçmişi yok
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 max-w-sm">
              Haberleri okudukça geçmişin burada birikmeye başlayacak.
            </p>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
            >
              Haber okumaya başla →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByDay).map(([date, entries]) => {
              // Compare with today/yesterday for nice labels
              const dateObj = new Date(entries[0].readAt);
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              
              let displayDate = date;
              if (dateObj.toDateString() === today.toDateString()) {
                displayDate = "Bugün";
              } else if (dateObj.toDateString() === yesterday.toDateString()) {
                displayDate = "Dün";
              }

              return (
                <div key={date}>
                  <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4 px-2">
                    {displayDate}
                  </h3>
                  <div className="space-y-3">
                    {entries.map((entry, idx) => (
                      <div key={idx} className="flex gap-4 p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm relative overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <Link href={`/news/${entry.slug}`}>
                            <h4 className="text-sm font-bold text-stone-900 dark:text-white line-clamp-2 leading-snug hover:text-amber-600 dark:hover:text-amber-400 transition-colors mb-2" style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
                              {entry.title}
                            </h4>
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-medium">
                            {entry.category && (
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 uppercase tracking-wider text-[9px] font-black">
                                {CATEGORY_LABELS[(Array.isArray(entry.category) ? entry.category[0] : entry.category).toLowerCase()] || (Array.isArray(entry.category) ? entry.category[0] : entry.category)}
                              </span>
                            )}
                            <span className="truncate max-w-24">{entry.source}</span>
                            <span className="text-stone-300 dark:text-stone-700">·</span>
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {Math.max(1, Math.round((entry.secondsSpent || 0) / 60))} dk
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            <div className="pt-8 pb-4 flex justify-center border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={handleClearHistory}
                className="px-6 py-2.5 rounded-full text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                Geçmişi Temizle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
