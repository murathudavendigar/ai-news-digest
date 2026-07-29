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
    <div className="page-shell min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-black text-[var(--text-primary)]">
          Okuma Geçmişim
        </h1>
        
        {/* Stats Widget */}
        <div className="mb-10">
          <ReadingStatsWidget />
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="mb-2 text-xl font-bold text-[var(--text-primary)]">
              Henüz okuma geçmişi yok
            </p>
            <p className="mb-6 max-w-sm text-sm text-[var(--text-muted)]">
              Haberleri okudukça geçmişin burada birikmeye başlayacak.
            </p>
            <Link
              href="/"
              className="rounded-full bg-[var(--text-primary)] px-6 py-2.5 font-bold text-[var(--bg-primary)] transition-opacity hover:opacity-90"
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
                  <h3 className="mb-4 px-2 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {displayDate}
                  </h3>
                  <div className="space-y-3">
                    {entries.map((entry, idx) => (
                      <div key={idx} className="relative flex gap-4 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-sm">
                        <div className="min-w-0 flex-1">
                          <Link href={`/news/${entry.slug}`}>
                            <h4 className="mb-2 line-clamp-2 font-[family-name:var(--font-display)] text-sm font-bold leading-snug text-[var(--text-primary)] transition-colors hover:text-[var(--accent-brand)]">
                              {entry.title}
                            </h4>
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
                            {entry.category && (
                              <span className="rounded-md bg-[var(--bg-elevated)] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                                {CATEGORY_LABELS[(Array.isArray(entry.category) ? entry.category[0] : entry.category).toLowerCase()] || (Array.isArray(entry.category) ? entry.category[0] : entry.category)}
                              </span>
                            )}
                            <span className="max-w-24 truncate">{entry.source}</span>
                            <span className="text-[var(--border-subtle)]">·</span>
                            <span className="flex items-center gap-1 text-[var(--success)]">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            
            <div className="flex justify-center border-t border-[var(--border-subtle)] pb-4 pt-8">
              <button
                onClick={handleClearHistory}
                className="rounded-full px-6 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
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
