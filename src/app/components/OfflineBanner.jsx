"use client";

import { useEffect, useState } from "react";

/**
 * Kullanıcı çevrimdışı olduğunda sayfanın üstünde görünen banner.
 * online → offline geçişini dinler, banner'ı gösterir.
 * offline → online geçişinde 2 saniye "Bağlandı" gösterir, sonra kapanır.
 */
export default function OfflineBanner() {
  // Always start online — navigator.onLine can be false during page load even
  // when actually connected. Defer the real check to useEffect after mount.
  const [status, setStatus] = useState("online"); // "online" | "offline" | "reconnected"

  useEffect(() => {
    const onOffline = () => setStatus("offline");
    const onOnline = () => {
      setStatus("reconnected");
      setTimeout(() => setStatus("online"), 2500);
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    // Check real status after mount — deferred so it doesn't conflict with hydration
    const id = setTimeout(() => {
      if (!navigator.onLine) setStatus("offline");
    }, 300);

    return () => {
      clearTimeout(id);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (status === "online") return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-xs
        z-200 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl
        text-xs font-bold transition-all duration-300
        ${
          status === "offline"
            ? "bg-red-600 text-white"
            : "bg-emerald-600 text-white"
        }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
      {status === "offline" ? (
        <>
          <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse shrink-0" />
          <span>📡 Çevrimdışısınız — önbellek gösteriliyor</span>
        </>
      ) : (
        <>
          <span className="shrink-0">✓</span>
          <span>Bağlantı yeniden kuruldu</span>
        </>
      )}
    </div>
  );
}
