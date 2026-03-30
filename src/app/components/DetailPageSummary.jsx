"use client";

import { useEffect, useState, useRef } from "react";

function Skeleton({ className = "", colorClass = "bg-[#e7e5e4] dark:bg-stone-800" }) {
  return (
    <div className={`rounded-lg animate-pulse ${colorClass} ${className}`} />
  );
}

/**
 * Client component that fetches AI summary + bullets from /api/reader
 * and displays them on the detail page.
 */
export default function DetailPageSummary({ url, description }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (!url || fetched.current) return;
    fetched.current = true;
    setLoading(true);

    fetch(`/api/reader?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((result) => setData(result))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [url]);

  if (loading) {
    return (
      <>
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 mb-4">
          <Skeleton className="h-4 w-1/3 mb-3" colorClass="bg-amber-200 dark:bg-amber-900/40" />
          <Skeleton className="h-3 w-full mb-2" colorClass="bg-amber-200 dark:bg-amber-900/40" />
          <Skeleton className="h-3 w-full mb-2" colorClass="bg-amber-200 dark:bg-amber-900/40" />
          <Skeleton className="h-3 w-2/3" colorClass="bg-amber-200 dark:bg-amber-900/40" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-4 w-9/12" />
        </div>
      </>
    );
  }

  const summary = data?.summary || description;
  const bullets = data?.bullets || [];

  if (!summary && bullets.length === 0) return null;

  return (
    <>
      {/* AI Summary */}
      {summary && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm">🤖</span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              AI Özeti
            </span>
          </div>
          <p
            className="text-sm leading-relaxed text-stone-700 dark:text-stone-300"
            style={{ fontFamily: "var(--font-body, Georgia, serif)" }}>
            {summary}
          </p>
        </div>
      )}

      {/* Bullet Points */}
      {bullets.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider mb-3">
            Önemli Noktalar
          </p>
          <ul className="space-y-2.5">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700 dark:text-stone-300">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
