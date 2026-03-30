"use client";

import { CATEGORY_LABELS } from "@/app/lib/categoryConfig";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import CredibilityBadge from "./CredibilityBadge";
import ArticleReactions from "./ArticleReactions";
import SaveButton from "./SaveButton";
import { useReadingTracker } from "@/app/hooks/useReadingTracker";

function Skeleton({ className = "" }) {
  return (
    <div className={`rounded-lg animate-pulse bg-stone-200 dark:bg-stone-800 ${className}`} />
  );
}

/* ── Bullets List ────────────────────────────────────── */
function BulletList({ bullets }) {
  if (!bullets || bullets.length === 0) return null;
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
          Önemli Noktalar
        </span>
      </div>
      <ul className="space-y-2.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700 dark:text-stone-300">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Content Skeleton ────────────────────────────────── */
function ContentSkeleton() {
  return (
    <>
      {/* Headline */}
      <Skeleton className="h-7 w-full mb-2" />
      <Skeleton className="h-7 w-3/4 mb-4" />
      {/* Image */}
      <Skeleton className="w-full aspect-video mb-6 rounded-xl" />
      {/* Summary */}
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-6" />
      {/* Bullets */}
      <Skeleton className="h-4 w-4/5 mb-2" />
      <Skeleton className="h-4 w-3/5 mb-2" />
      <Skeleton className="h-4 w-9/12 mb-2" />
    </>
  );
}

/* ── Main ReaderSheet ────────────────────────────────── */
export default function ReaderBottomSheet({ isOpen, onClose, article }) {
  useReadingTracker(isOpen ? article : null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const cacheRef = useRef(new Map());
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const dragStartY = useRef(null);
  const dragDelta = useRef(0);
  const dragStartTime = useRef(0);

  // ── Open / close animation ──
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
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ── Fetch ──
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

  // ── Body scroll lock ──
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ── Escape key ──
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // ── Close with animation ──
  const handleClose = useCallback(() => {
    setSlideIn(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  // ── Share ──
  const handleShare = useCallback(async () => {
    const shareUrl = article?.link || data?.sourceUrl || "";
    const shareData = { title: article?.title || "", url: shareUrl };
    try {
      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch { /* user cancelled */ }
  }, [article, data]);

  // ── Drag to dismiss (only from drag handle area, not content scroll) ──
  const handleTouchStart = (e) => {
    // Only allow drag from the handle area (first 48px of sheet)
    const rect = sheetRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touchY = e.touches[0].clientY;
    const relY = touchY - rect.top;
    // If we're not in the handle zone AND content is scrolled, don't drag
    if (relY > 48 && contentRef.current && contentRef.current.scrollTop > 0) return;
    dragStartY.current = e.touches[0].clientY;
    dragDelta.current = 0;
    dragStartTime.current = Date.now();
  };

  const handleTouchMove = (e) => {
    if (dragStartY.current === null) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) {
      dragDelta.current = delta;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${delta}px)`;
        sheetRef.current.style.transition = "none";
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragStartY.current === null) return;
    const elapsed = Date.now() - dragStartTime.current;
    const velocity = elapsed > 0 ? (dragDelta.current / elapsed) * 1000 : 0;

    if (dragDelta.current > 120 || velocity > 500) {
      handleClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transition = "";
      sheetRef.current.style.transform = "";
    }
    dragStartY.current = null;
    dragDelta.current = 0;
  };

  if (!visible) return null;

  const displayTitle = article?.title || "Yükleniyor…";
  const sourceName = article?.source_name || data?.sourceName || "Kaynak";
  const catLabel = article?.category?.[0]
    ? CATEGORY_LABELS[article.category[0].toLowerCase()] || article.category[0]
    : null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            slideIn ? "opacity-60" : "opacity-0"
          }`}
          onClick={handleClose}
        />

        {/* Sheet */}
        <div
          ref={sheetRef}
          className={`relative w-full md:max-w-[680px] bg-white dark:bg-stone-900
                      rounded-t-[28px] md:rounded-[28px] shadow-2xl overflow-hidden
                      flex flex-col
                      ${slideIn ? "translate-y-0" : "translate-y-full"}`}
          style={{
            height: "94vh",
            maxHeight: "94vh",
            transition: slideIn
              ? "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)"
              : "transform 280ms ease-in",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
          </div>

          {/* Header bar: category + source + close */}
          <div className="flex items-center justify-between px-5 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              {catLabel && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-sm">
                  {catLabel}
                </span>
              )}
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                {sourceName}
              </span>
              <CredibilityBadge sourceName={sourceName} />
            </div>
            <div className="flex items-center gap-2">
              <SaveButton article={article} showLabel={false} />
              <button
                onClick={handleClose}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                aria-label="Kapat"
              >
                <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto overscroll-contain px-5 pb-24"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {loading ? (
              <ContentSkeleton />
            ) : (
              <>
                {/* Headline */}
                <h2
                  className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-white leading-tight mb-4"
                  style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
                >
                  {displayTitle}
                </h2>

                {/* Thumbnail */}
                {(article?.image_url || data?.mainImage) && (
                  <div className="relative w-full aspect-video mb-5 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800">
                    <img
                      src={article?.image_url || data?.mainImage}
                      alt={displayTitle}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* AI Summary */}
                {(data?.summary || loading) && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-sm">🤖</span>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        AI Özeti
                      </span>
                    </div>
                    <p
                      className="text-sm leading-relaxed text-stone-700 dark:text-stone-300"
                      style={{ fontFamily: "var(--font-body, Georgia, serif)" }}
                    >
                      {data?.summary}
                    </p>
                  </div>
                )}

                {/* Bullet Points */}
                <BulletList bullets={data?.bullets} />

                {/* Scraping failed fallback */}
                {data?.scrapingFailed && !data?.summary && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📄</div>
                    <p className="text-stone-600 dark:text-stone-400 mb-2">
                      İçerik alınamadı
                    </p>
                    <p className="text-sm text-stone-500">
                      Haberi okumak için kaynağa gidin
                    </p>
                  </div>
                )}

                {/* Article Reactions */}
                <div className="my-6">
                  <ArticleReactions articleSlug={article?.slug} categorySlug={article?.category?.[0]} compact={false} />
                </div>
              </>
            )}
          </div>

          {/* Sticky footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-white via-white dark:from-stone-900 dark:via-stone-900 to-transparent pt-8">
            <div className="flex gap-3">
              <a
                href={article?.link || data?.sourceUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6
                           border border-stone-300 dark:border-stone-600
                           text-stone-700 dark:text-stone-300
                           font-semibold rounded-xl
                           hover:bg-stone-50 dark:hover:bg-stone-800
                           transition-colors"
              >
                Kaynağa Git
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 py-3 px-5
                           bg-stone-900 dark:bg-white text-white dark:text-stone-900
                           font-semibold rounded-xl
                           hover:bg-stone-800 dark:hover:bg-stone-100
                           transition-colors shadow-lg"
              >
                Paylaş
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
