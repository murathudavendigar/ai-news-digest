"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 64; // kaç px çekilince tetiklensin
const MAX_PULL = 96; // göstergenin max yüksekliği

/**
 * @param {{ containerRef?: React.RefObject, onRefresh?: () => void | Promise<void> }} [opts]
 * onRefresh verilirse router.refresh yerine o çağrılır (client feed için).
 */
export function usePullToRefresh({ containerRef, onRefresh } = {}) {
  const router = useRouter();
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(null);
  const pullingRef = useRef(false);
  const pullYRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (onRefreshRef.current) {
        await onRefreshRef.current();
      } else {
        router.refresh();
        await new Promise((r) => setTimeout(r, 800));
      }
    } catch (err) {
      console.error("[usePullToRefresh]", err);
    } finally {
      setRefreshing(false);
      pullYRef.current = 0;
      setPullY(0);
    }
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
        pullYRef.current = 0;
        setPullY(0);
        return;
      }

      pullingRef.current = true;
      const clamped = Math.min(delta * 0.45, MAX_PULL);
      pullYRef.current = clamped;
      setPullY(clamped);

      if (delta > 8) e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) return;
      if (pullYRef.current >= THRESHOLD && !refreshing) {
        refresh();
      } else {
        pullYRef.current = 0;
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
  }, [refreshing, refresh, containerRef]);

  return { pullY, refreshing, threshold: THRESHOLD };
}
