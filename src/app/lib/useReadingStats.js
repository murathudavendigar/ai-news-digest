"use client";

import { useEffect, useState } from "react";

const HISTORY_KEY = "haberai:article-history";

function loadHistory() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Okuma istatistiklerini localStorage geçmişinden hesaplar.
 * SSR-safe: mount öncesi tüm değerler 0/null döner.
 */
export function useReadingStats() {
  const [stats, setStats] = useState(null);
  const [mounted, setMounted] = useState(false);

  function compute() {
    const history = loadHistory();
    const now = Date.now();
    const todayStart = startOfDay();
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;

    // Toplam
    const total = history.length;

    // Bugün
    const todayItems = history.filter((a) => (a.readAt ?? 0) >= todayStart);
    const todayCount = todayItems.length;

    // Bu hafta
    const weekItems = history.filter((a) => (a.readAt ?? 0) >= weekStart);
    const weekCount = weekItems.length;

    // Favori kategori (bu hafta içinden)
    const catMap = {};
    weekItems.forEach((a) => {
      const cats = Array.isArray(a.category)
        ? a.category
        : a.category
          ? [a.category]
          : [];
      cats.forEach((c) => {
        catMap[c] = (catMap[c] || 0) + 1;
      });
    });
    const favoriteCategory =
      Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const favoriteCategoryCount = favoriteCategory
      ? catMap[favoriteCategory]
      : 0;

    // Günlük ortalama (son 7 gün)
    const avgPerDay = +(weekCount / 7).toFixed(1);

    // Streak: üst üste kaç gün okuma var (bugün dahil)
    const daySet = new Set(history.map((a) => dayKey(a.readAt ?? 0)));
    let streak = 0;
    let cursor = new Date();
    // Bugün hiç okumadıysa dünden başla
    if (!daySet.has(dayKey(now))) cursor.setDate(cursor.getDate() - 1);
    while (daySet.has(dayKey(cursor.getTime()))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Tahmini okuma süresi (dakika) — haber başına ~2.5 dk
    const estimatedMinutes = Math.round(total * 2.5);

    // Son 7 günün gün gün dağılımı — bar chart için
    const dailyBreakdown = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = d.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const count = history.filter((a) => {
        const t = a.readAt ?? 0;
        return t >= start && t < end;
      }).length;
      const label =
        i === 0
          ? "Bug."
          : ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][d.getDay()];
      dailyBreakdown.push({ label, count });
    }

    return {
      total,
      todayCount,
      weekCount,
      favoriteCategory,
      favoriteCategoryCount,
      avgPerDay,
      streak,
      estimatedMinutes,
      dailyBreakdown,
    };
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setStats(compute());
      setMounted(true);
    }, 0);

    // localStorage değişince güncelle
    const onStorage = (e) => {
      if (e.key === HISTORY_KEY) setStats(compute());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearTimeout(t);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { stats, mounted };
}
