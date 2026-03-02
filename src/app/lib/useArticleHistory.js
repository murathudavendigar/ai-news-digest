"use client";

import { useEffect, useState } from "react";

const KEY = "haberai:article-history";
const MAX = 100;

/** Makale objesinden kaydedilecek minimal veriyi çıkar */
function toHistoryEntry(article) {
  return {
    article_id: article.article_id,
    title: article.title,
    image_url: article.image_url ?? null,
    source_name: article.source_name ?? null,
    source_icon: article.source_icon ?? null,
    link: article.link ?? null,
    pubDate: article.pubDate ?? null,
    category: article.category ?? null,
    readAt: Date.now(),
  };
}

/** LocalStorage'dan geçmişi al (SSR-safe) */
function loadHistory() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

/** Makaleyi geçmişe ekle — başa yazar, MAX adet tutar, var olanı günceller */
export function trackArticle(article) {
  if (typeof window === "undefined" || !article?.article_id) return;
  try {
    const prev = loadHistory();
    const filtered = prev.filter((a) => a.article_id !== article.article_id);
    const next = [toHistoryEntry(article), ...filtered].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    // Sekme senkronizasyonu için custom event fırlat
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  } catch {}
}

/** Makale okunmuş mu? (Senkron, useEffect gerektirmez) */
export function isArticleRead(articleId) {
  if (typeof window === "undefined" || !articleId) return false;
  try {
    const history = loadHistory();
    return history.some((a) => a.article_id === articleId);
  } catch {
    return false;
  }
}

/** Geçmişi temizle */
export function clearArticleHistory() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  } catch {}
}

/** Geçmiş hook'u — { history, clearHistory, mounted } */
export function useArticleHistory() {
  const [history, setHistory] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // İlk yükleme — cascade render'ı önlemek için setTimeout 0
    const t = setTimeout(() => {
      setHistory(loadHistory());
      setMounted(true);
    }, 0);

    // Çapraz sekme / kart senkronizasyonu
    const onStorage = (e) => {
      if (e.key === KEY) setHistory(loadHistory());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearTimeout(t);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return {
    history,
    clearHistory: clearArticleHistory,
    mounted,
  };
}
