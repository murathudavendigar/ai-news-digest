"use client";

import { useEffect } from "react";

/**
 * Service Worker'ı kayıt eden client bileşeni.
 * layout.js'e <ServiceWorkerRegistration /> olarak eklenir.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // Yeni sürüm hazır — isteğe bağlı güncelleme bildirimi burada yapılabilir
            }
          });
        });
      } catch {
        // SW kayıt hatası — uygulamayı engelleme
      }
    };

    // Sayfanın yavaşlamaması için load sonrası kayıt yap
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
