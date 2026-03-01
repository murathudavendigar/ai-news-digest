"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "haberai:bookmarks";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // setTimeout → setState'i effect body'sinin dışına erteler, cascade render yok
    const id = setTimeout(() => {
      setBookmarks(read());
      setMounted(true);
    }, 0);

    // Diğer sekmelerdeki değişiklikleri yakala
    const onStorage = (e) => {
      if (e.key === KEY) setBookmarks(read());
    };
    window.addEventListener("storage", onStorage);

    return () => {
      clearTimeout(id);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggle = useCallback((article) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.article_id === article.article_id);
      const next = exists
        ? prev.filter((b) => b.article_id !== article.article_id)
        : [{ ...article, savedAt: new Date().toISOString() }, ...prev];
      write(next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (id) => bookmarks.some((b) => b.article_id === id),
    [bookmarks],
  );

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setBookmarks([]);
  }, []);

  return { bookmarks, toggle, isBookmarked, clear, mounted };
}
