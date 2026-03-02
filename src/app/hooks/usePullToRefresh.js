"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 64; // kaç px çekilince tetiklensin
const MAX_PULL = 96; // göstergenin max yüksekliği

export function usePullToRefresh({ containerRef } = {}) {
  const router = useRouter();
  const [pullY, setPullY] = useState(0); // 0-MAX_PULL arası
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(null);
  const pullingRef = useRef(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    router.refresh();
    // Kısa gecikme — kullanıcı "yenilendi" hissini alsın
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
    setPullY(0);
  }, [router]);

  useEffect(() => {
    const el = containerRef?.current ?? document;
    const scrollEl = document.documentElement;

    const onTouchStart = (e) => {
      if (scrollEl.scrollTop > 0) return;
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = false;
    };

    const onTouchMove = (e) => {
      if (startYRef.current === null) return;
      if (scrollEl.scrollTop > 0) return;
      if (refreshing) return;

      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) {
        pullingRef.current = false;
        setPullY(0);
        return;
      }

      pullingRef.current = true;
      // Rubber-band etkisi: çekiş ilerledikçe direnç artar
      const clamped = Math.min(delta * 0.45, MAX_PULL);
      setPullY(clamped);

      // Tarayıcının kendi scroll'unu engelle
      if (delta > 8) e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) return;
      if (pullY >= THRESHOLD && !refreshing) {
        refresh();
      } else {
        setPullY(0);
      }
      startYRef.current = null;
      pullingRef.current = false;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [refreshing, pullY, refresh, containerRef]);

  return { pullY, refreshing, threshold: THRESHOLD };
}
