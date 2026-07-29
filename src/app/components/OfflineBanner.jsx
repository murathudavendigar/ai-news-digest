"use client";

import { useEffect, useState } from "react";

/**
 * Çevrimdışı / yeniden bağlantı bildirim bandı.
 */
export default function OfflineBanner() {
  const [status, setStatus] = useState("online"); // online | offline | reconnected

  useEffect(() => {
    const onOffline = () => setStatus("offline");
    const onOnline = () => {
      setStatus("reconnected");
      setTimeout(() => setStatus("online"), 2500);
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

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

  const offline = status === "offline";

  return (
    <div
      role="status"
      className={`fixed bottom-4 left-4 right-4 z-200 flex items-center gap-2.5 border px-4 py-3 text-xs font-bold shadow-lg md:left-auto md:right-4 md:max-w-xs ${
        offline
          ? "border-[var(--danger)] bg-[var(--danger)] text-white"
          : "border-emerald-600 bg-emerald-600 text-white"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      {offline ? (
        <>
          <span
            className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-white/70"
            aria-hidden="true"
          />
          <span>Çevrimdışısın — önbellek gösteriliyor</span>
        </>
      ) : (
        <>
          <span className="shrink-0" aria-hidden="true">
            ✓
          </span>
          <span>Bağlantı yeniden kuruldu</span>
        </>
      )}
    </div>
  );
}
