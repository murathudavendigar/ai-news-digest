"use client";

import { useEffect, useState } from "react";

const KEY = "haberai:user-preferences";

export const DEFAULT_PREFERENCES = {
  /** Öncelikli gösterilecek kategoriler (slug dizisi, boşsa hepsi eşit) */
  preferredCategories: [],
  /** Takip edilen konu/anahtar kelimeler (string dizisi) */
  followedTopics: [],
  /** Haber arayüz dili */
  language: "tr", // "tr" | "en"
  /** AI özet uzunluğu */
  summaryLength: "normal", // "short" | "normal" | "detailed"
  /** Okunmuş haberleri Feed'de soluk göster */
  dimReadArticles: true,
};

function loadPrefs() {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePrefs(prefs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  } catch {}
}

/**
 * Kullanıcı tercihlerini localStorage'dan oku/yaz.
 * @returns {{ prefs, setPrefs, mounted }}
 */
export function useUserPreferences() {
  const [prefs, setPrefsState] = useState(DEFAULT_PREFERENCES);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setPrefsState(loadPrefs());
      setMounted(true);
    }, 0);

    const onStorage = (e) => {
      if (e.key === KEY) setPrefsState(loadPrefs());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearTimeout(t);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setPrefs = (updater) => {
    setPrefsState((prev) => {
      const next =
        typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      savePrefs(next);
      return next;
    });
  };

  return { prefs, setPrefs, mounted };
}

/**
 * Tercih edilen kategorilere göre makale listesini sırala.
 * Tercihli kategorideki makaleler başa gelir, geri kalanlar sırası korunur.
 */
export function sortByPreferredCategories(articles, preferredCategories) {
  if (!preferredCategories?.length) return articles;
  const pref = new Set(preferredCategories);
  const preferred = articles.filter((a) =>
    a.category?.some((c) => pref.has(c)),
  );
  const rest = articles.filter((a) => !a.category?.some((c) => pref.has(c)));
  return [...preferred, ...rest];
}

/**
 * Takip edilen konulara göre makale listesini sırala.
 * Başlık veya açıklamasında takip edilen konu geçen makaleler başa gelir.
 */
export function sortByFollowedTopics(articles, followedTopics) {
  if (!followedTopics?.length) return articles;
  const lower = followedTopics.map((t) => t.toLowerCase());
  const matches = articles.filter((a) =>
    lower.some(
      (t) =>
        a.title?.toLowerCase().includes(t) ||
        a.description?.toLowerCase().includes(t),
    ),
  );
  const rest = articles.filter(
    (a) =>
      !lower.some(
        (t) =>
          a.title?.toLowerCase().includes(t) ||
          a.description?.toLowerCase().includes(t),
      ),
  );
  return [...matches, ...rest];
}
