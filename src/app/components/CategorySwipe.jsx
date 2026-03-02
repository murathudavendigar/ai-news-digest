"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

/**
 * Kategori sayfaları arası dokunmatik geçişi sağlar.
 * - Swipe left  → sonraki kategori
 * - Swipe right → önceki kategori
 * Kenar göstergeleri, aktif olmayan yönlerde geçilebilecek kategoriyi gösterir.
 */
export default function CategorySwipe({ children, currentSlug, categoryKeys }) {
  const router = useRouter();
  const touchStartX = useRef(null);
  const [swipeDir, setSwipeDir] = useState(null); // "left" | "right" | null
  const THRESHOLD = 60; // px

  const currentIdx = categoryKeys.indexOf(currentSlug);
  const prevSlug = currentIdx > 0 ? categoryKeys[currentIdx - 1] : null;
  const nextSlug =
    currentIdx < categoryKeys.length - 1 ? categoryKeys[currentIdx + 1] : null;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setSwipeDir(null);
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 20) {
      setSwipeDir(delta < 0 ? "left" : "right");
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    setSwipeDir(null);

    if (Math.abs(delta) < THRESHOLD) return;

    if (delta < 0 && nextSlug) {
      router.push(`/category/${nextSlug}`);
    } else if (delta > 0 && prevSlug) {
      router.push(`/category/${prevSlug}`);
    }
  };

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}>
      {/* Sol kenar göstergesi (önceki kategori) */}
      {prevSlug && (
        <div
          className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none
                      transition-all duration-200 md:hidden
                      ${swipeDir === "right" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}>
          <div className="flex items-center gap-1 bg-stone-900/80 dark:bg-stone-100/80 text-white dark:text-stone-900 text-[10px] font-bold py-2 pl-1 pr-3 rounded-r-xl backdrop-blur-sm shadow-lg">
            <span className="text-base">‹</span>
            <span className="capitalize">{prevSlug}</span>
          </div>
        </div>
      )}

      {/* Sağ kenar göstergesi (sonraki kategori) */}
      {nextSlug && (
        <div
          className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none
                      transition-all duration-200 md:hidden
                      ${swipeDir === "left" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}`}>
          <div className="flex items-center gap-1 bg-stone-900/80 dark:bg-stone-100/80 text-white dark:text-stone-900 text-[10px] font-bold py-2 pr-1 pl-3 rounded-l-xl backdrop-blur-sm shadow-lg">
            <span className="capitalize">{nextSlug}</span>
            <span className="text-base">›</span>
          </div>
        </div>
      )}

      {/* Sayfa içeriği */}
      {children}

      {/* Desktop: kategori nav okları (sayfa başlığının yanına) */}
      {(prevSlug || nextSlug) && (
        <div className="hidden md:flex items-center gap-2 mt-8 justify-center">
          <button
            disabled={!prevSlug}
            onClick={() => prevSlug && router.push(`/category/${prevSlug}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                       bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400
                       hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30
                       transition-colors">
            ‹ {prevSlug ?? ""}
          </button>
          <span className="text-xs text-stone-300 dark:text-stone-600">|</span>
          <button
            disabled={!nextSlug}
            onClick={() => nextSlug && router.push(`/category/${nextSlug}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                       bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400
                       hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30
                       transition-colors">
            {nextSlug ?? ""} ›
          </button>
        </div>
      )}
    </div>
  );
}
