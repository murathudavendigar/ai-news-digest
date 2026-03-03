"use client";

import { CRON, formatCronTimeLocal } from "@/app/lib/siteConfig";
import { useEffect, useState } from "react";
import PushNotificationToggle from "./PushNotificationToggle";

const DISMISSED_KEY = "haberai:push-prompt-dismissed";

export default function PushPrompt() {
  const [show, setShow] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Bildirim desteği yok veya zaten izin verilmiş/reddedilmişse gösterme
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    )
      return;

    if (Notification.permission !== "default") return;

    // Daha önce kapatıldıysa gösterme
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Sayfa açıldıktan 4 saniye sonra göster
    const timer = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  };

  const handleSubscribed = () => {
    setSuccess(true);
    setTimeout(() => {
      localStorage.setItem(DISMISSED_KEY, "1");
      setShow(false);
    }, 2500);
  };

  if (!show) return null;

  const pushTime = formatCronTimeLocal(CRON.PUSH_NOTIFY_UTC_HOUR);

  return (
    <div
      className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6
                  left-1/2 -translate-x-1/2
                  w-[calc(100%-2rem)] max-w-sm
                  z-50
                  bg-white dark:bg-stone-900
                  border border-stone-200 dark:border-stone-700
                  rounded-2xl shadow-xl shadow-stone-900/10 dark:shadow-stone-950/40
                  p-4
                  animate-in slide-in-from-bottom-4 duration-300`}>
      <div className="flex items-start gap-3">
        {success ? (
          <>
            <div className="text-2xl mt-0.5 shrink-0">✅</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Bildirimler aktif!
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Artık günlük özetleri ve önemli haberleri anında alacaksın. 👌
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-2xl mt-0.5 shrink-0">🔔</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Günlük özetleri kaçırma
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Her akşam {pushTime}&apos;da manşetler ve önemli haberler
                doğrudan sana gelsin.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <PushNotificationToggle onSubscribed={handleSubscribed} />
                <button
                  onClick={dismiss}
                  className="px-2 py-1 text-xs transition-colors text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                  Hayır, istemiyorum
                </button>
              </div>
            </div>
            <button
              onClick={dismiss}
              aria-label="Kapat"
              className="transition-colors shrink-0 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
              <svg
                className="w-4 h-4"
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
          </>
        )}
      </div>
    </div>
  );
}
