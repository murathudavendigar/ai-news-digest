"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 72; // px çekmek gerekiyor
const MAX_PULL = 110; // maksimum görsel uzama

export default function PullToRefresh({ children }) {
  const router = useRouter();
  const [pullY, setPullY] = useState(0); // 0..MAX_PULL
  const [phase, setPhase] = useState("idle"); // idle | pulling | ready | refreshing
  const startYRef = useRef(null);
  const containerRef = useRef(null);

  const progress = Math.min(pullY / THRESHOLD, 1); // 0..1

  const handleTouchStart = useCallback((e) => {
    // Sadece sayfanın en üstündeyken etkinleştir
    if (window.scrollY > 0) return;
    startYRef.current = e.touches[0].clientY;
    setPhase("pulling");
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) {
      setPullY(0);
      return;
    }
    // Overscroll engeli
    if (window.scrollY > 0) {
      startYRef.current = null;
      setPullY(0);
      setPhase("idle");
      return;
    }
    // Direnç efekti: gerçek deltanın karekökü alınır
    const resistance = Math.sqrt(delta) * 4.5;
    const clamped = Math.min(resistance, MAX_PULL);
    setPullY(clamped);
    setPhase(clamped >= THRESHOLD ? "ready" : "pulling");
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (startYRef.current === null) return;
    startYRef.current = null;

    if (phase === "ready") {
      setPhase("refreshing");
      setPullY(THRESHOLD * 0.85); // yükleme konumunda kilitle
      // Next.js cache'i yenile
      router.refresh();
      // Kısa bekleyip geri çek
      setTimeout(() => {
        setPhase("idle");
        setPullY(0);
      }, 1400);
    } else {
      setPhase("idle");
      setPullY(0);
    }
  }, [phase, router]);

  useEffect(() => {
    const el = document.documentElement;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const indicatorVisible = pullY > 4 || phase === "refreshing";

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indikatörü */}
      <div
        aria-hidden="true"
        style={{
          height: `${pullY}px`,
          transition: phase === "idle" ? "height 0.3s ease" : "none",
        }}
        className="flex items-end justify-center overflow-hidden">
        {indicatorVisible && (
          <div
            style={{
              opacity: progress,
              transform: `scale(${0.6 + progress * 0.4})`,
            }}
            className="flex items-center justify-center w-8 h-8 mb-2 transition-transform bg-white border rounded-full shadow-sm dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            {phase === "refreshing" ? (
              <svg
                className="w-4 h-4 text-stone-500 animate-spin"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-stone-400"
                style={{
                  transform: `rotate(${phase === "ready" ? 180 : progress * 160}deg)`,
                  transition: "transform 0.15s ease",
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* İçerik */}
      <div
        style={{
          transform: `translateY(${pullY * 0.25}px)`,
          transition: phase === "idle" ? "transform 0.3s ease" : "none",
        }}>
        {children}
      </div>
    </div>
  );
}
