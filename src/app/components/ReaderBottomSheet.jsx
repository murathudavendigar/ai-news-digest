"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700 ${className}`}
    />
  );
}

function ArticleBody({ text }) {
  if (!text) return null;
  return (
    <div
      className="article-body"
      style={{ fontFamily: "var(--font-body, Georgia, serif)" }}>
      {text
        .split(/\n\n+/)
        .filter(Boolean)
        .map((para, i) => {
          const trimmed = para.trim();
          if (trimmed.startsWith("## ")) {
            return (
              <h3
                key={i}
                className="text-xl font-bold mt-6 mb-3 text-stone-900 dark:text-white"
                style={{
                  fontFamily: "var(--font-display, Georgia, serif)",
                }}>
                {trimmed.replace("## ", "")}
              </h3>
            );
          }
          if (trimmed.startsWith("> ")) {
            return (
              <blockquote
                key={i}
                className="border-l-4 border-amber-400 pl-4 italic text-stone-600 dark:text-stone-400 my-4">
                {trimmed.replace("> ", "")}
              </blockquote>
            );
          }
          return (
            <p
              key={i}
              className="mb-4 leading-[1.75] text-base text-stone-800 dark:text-stone-200">
              {trimmed}
            </p>
          );
        })}
    </div>
  );
}

export default function ReaderBottomSheet({ isOpen, onClose, article }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const cacheRef = useRef(new Map());
  const sheetRef = useRef(null);
  const dragStartY = useRef(null);
  const dragDelta = useRef(0);

  // Open animation
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSlideIn(true));
      });
    } else {
      setSlideIn(false);
      const timer = setTimeout(() => {
        setVisible(false);
        setData(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Fetch data
  useEffect(() => {
    if (!isOpen || !article?.link) return;
    const url = article.link;

    if (cacheRef.current.has(url)) {
      setData(cacheRef.current.get(url));
      return;
    }

    setLoading(true);
    setData(null);

    fetch(`/api/reader?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((result) => {
        cacheRef.current.set(url, result);
        setData(result);
      })
      .catch(() => {
        setData({ scrapingFailed: true, sourceUrl: url });
      })
      .finally(() => setLoading(false));
  }, [isOpen, article?.link]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Close animation
  const handleClose = useCallback(() => {
    setSlideIn(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Drag to dismiss
  const handleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    dragDelta.current = 0;
  };

  const handleTouchMove = (e) => {
    if (dragStartY.current === null) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) {
      dragDelta.current = delta;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${delta}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragDelta.current > 120) {
      handleClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    dragStartY.current = null;
    dragDelta.current = 0;
  };

  if (!visible) return null;

  const displayTitle = data?.title || article?.title || "Yükleniyor…";
  const sourceName =
    data?.sourceName || article?.source_name || "Kaynak";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          slideIn ? "opacity-50" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-t-3xl shadow-2xl
                    transition-transform duration-300 ease-out
                    ${slideIn ? "translate-y-0" : "translate-y-full"}`}
        style={{ height: "92vh", maxHeight: "92vh" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
        </div>

        {/* Scrollable content */}
        <div className="flex flex-col h-[calc(100%-3rem)] overflow-y-auto overscroll-contain px-5 pb-24">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full">
                {sourceName}
              </span>
              <button
                onClick={handleClose}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                aria-label="Kapat">
                <svg
                  className="w-4 h-4 text-stone-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {loading ? (
              <>
                <Skeleton className="h-8 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2" />
              </>
            ) : (
              <>
                <h2
                  className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-white leading-tight mb-3"
                  style={{
                    fontFamily: "var(--font-display, Georgia, serif)",
                  }}>
                  {displayTitle}
                </h2>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  {data?.author && <span>{data.author}</span>}
                  {data?.author && data?.publishedAt && (
                    <span className="text-stone-300 dark:text-stone-600">
                      ·
                    </span>
                  )}
                  {data?.publishedAt && (
                    <time>
                      {new Date(data.publishedAt).toLocaleDateString(
                        "tr-TR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </time>
                  )}
                </div>
              </>
            )}
          </div>

          {/* AI Summary */}
          <div className="mb-8">
            {loading ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <Skeleton className="h-4 w-1/3 mb-3 bg-amber-200! dark:bg-amber-900/40!" />
                <Skeleton className="h-3 w-full mb-2 bg-amber-200! dark:bg-amber-900/40!" />
                <Skeleton className="h-3 w-full mb-2 bg-amber-200! dark:bg-amber-900/40!" />
                <Skeleton className="h-3 w-2/3 bg-amber-200! dark:bg-amber-900/40!" />
              </div>
            ) : data?.summary ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm">🤖</span>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    AI Özeti
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed text-stone-700 dark:text-stone-300"
                  style={{
                    fontFamily: "var(--font-body, Georgia, serif)",
                  }}>
                  {data.summary}
                </p>
              </div>
            ) : null}
          </div>

          {/* Divider + Body */}
          {loading ? (
            <div>
              <Skeleton className="h-4 w-1/4 mb-6" />
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-3 w-full mb-3" />
              ))}
            </div>
          ) : data?.scrapingFailed ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📄</div>
              <p className="text-stone-600 dark:text-stone-400 mb-2">
                Tam metin alınamadı
              </p>
              <p className="text-sm text-stone-500">
                Tam metni görmek için kaynağa gidin
              </p>
            </div>
          ) : data?.bodyText ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
                <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                  Haberin Tamamı
                </span>
                <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
              </div>
              <ArticleBody text={data.bodyText} />
            </>
          ) : null}
        </div>

        {/* Sticky footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-white via-white dark:from-stone-900 dark:via-stone-900 to-transparent pt-8">
          <a
            href={article?.link || data?.sourceUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-6
                       bg-stone-900 dark:bg-white text-white dark:text-stone-900
                       font-semibold rounded-xl
                       hover:bg-stone-800 dark:hover:bg-stone-100
                       transition-colors shadow-lg">
            Kaynağa Git
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
