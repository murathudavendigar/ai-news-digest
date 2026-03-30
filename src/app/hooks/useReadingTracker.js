"use client";

import { useEffect, useRef } from "react";
import { incrementCategoryRead } from "@/app/lib/categoryStats";

export function useReadingTracker(article) {
  const startRef = useRef(null);
  const accumulatedRef = useRef(0);
  const isTracking = useRef(false);

  useEffect(() => {
    if (!article || !article.slug || typeof window === 'undefined') return;

    const startTimer = () => {
      if (!isTracking.current) {
        startRef.current = Date.now();
        isTracking.current = true;
      }
    };

    const flushTimer = () => {
      if (isTracking.current && startRef.current) {
        const ellapsed = Math.floor((Date.now() - startRef.current) / 1000);
        accumulatedRef.current += ellapsed;
        isTracking.current = false;
        startRef.current = null;
      }
    };

    // Start immediately
    startTimer();

    const handleVisibility = () => {
      if (document.hidden) {
        flushTimer();
      } else {
        startTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      flushTimer();

      // Only count as "read" if spent > 5 seconds
      if (accumulatedRef.current > 5) {
        try {
          // Increment category read
          if (article.category) {
            incrementCategoryRead(article.category, accumulatedRef.current);
          }

          // Save to reading history
          const history = JSON.parse(localStorage.getItem('haberai_reading_history') || '[]');
          
          // Remove if already exists to move to top, or keep to treat as new read session?
          // We'll just push as new session for timeline
          const entry = {
            slug: article.slug,
            title: article.title,
            category: article.category,
            source: article.source,
            readAt: new Date().toISOString(),
            secondsSpent: accumulatedRef.current,
          };
          
          const newHistory = [entry, ...history].slice(0, 500); // keep max 500
          localStorage.setItem('haberai_reading_history', JSON.stringify(newHistory));
          
          // Notify widget
          window.dispatchEvent(new Event('haberai_reading_stats_updated'));
          
        } catch (e) {
          console.error("Failed to save reading stats", e);
        }
      }
    };
  }, [article]);
}
