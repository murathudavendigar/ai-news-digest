"use client";

import { useEffect } from "react";

/**
 * Service Worker kayıt + görünürken güncelleme kontrolü.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;

        const onVisible = () => {
          if (document.visibilityState === "visible") {
            reg.update().catch(() => {});
          }
        };
        document.addEventListener("visibilitychange", onVisible);

        // cleanup closure
        return () => {
          document.removeEventListener("visibilitychange", onVisible);
        };
      } catch {
        return undefined;
      }
    };

    let cleanupFn;
    const start = () => {
      register().then((fn) => {
        cleanupFn = fn;
      });
    };

    if (document.readyState === "complete") {
      start();
    } else {
      window.addEventListener("load", start, { once: true });
    }

    return () => {
      cancelled = true;
      cleanupFn?.();
    };
  }, []);

  return null;
}
