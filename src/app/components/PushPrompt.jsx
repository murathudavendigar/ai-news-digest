"use client";

import { CRON, formatCronTimeLocal } from "@/app/lib/siteConfig";
import { useEffect, useState } from "react";
import PushNotificationToggle from "./PushNotificationToggle";

const DISMISSED_KEY = "haberai:push-prompt-dismissed";
const SNOOZE_KEY = "haberai:push-prompt-snooze";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000; // 3 gün

function shouldShowPrompt() {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return false;
  }
  // Onboarding açıkken gösterme
  if (document.documentElement.dataset.onboardingActive === "1") return false;
  if (localStorage.getItem("haberai:onboarding-v1") !== "1") return false;
  if (Notification.permission !== "default") return false;
  if (localStorage.getItem(DISMISSED_KEY) === "1") return false;
  const snoozeUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
  if (snoozeUntil && Date.now() < snoozeUntil) return false;
  return true;
}

export default function PushPrompt() {
  const [show, setShow] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!shouldShowPrompt()) return;

    // Engagement: biraz gezindikten sonra göster (agresif değil)
    let shown = false;
    const reveal = () => {
      if (shown || !shouldShowPrompt()) return;
      shown = true;
      setShow(true);
      cleanup();
    };

    const timer = setTimeout(reveal, 18000);
    const onScroll = () => {
      if (window.scrollY > 320) reveal();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
    return cleanup;
  }, []);

  const dismissForever = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    localStorage.removeItem(SNOOZE_KEY);
    setShow(false);
  };

  const snooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    setShow(false);
  };

  const handleSubscribed = () => {
    setSuccess(true);
    setTimeout(() => {
      localStorage.setItem(DISMISSED_KEY, "1");
      setShow(false);
    }, 2200);
  };

  if (!show) return null;

  const pushTime = formatCronTimeLocal(CRON.PUSH_NOTIFY_UTC_HOUR);

  return (
    <div
      role="dialog"
      aria-label="Bildirim önerisi"
      className="push-prompt fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50"
    >
      <div className="push-prompt-card">
        {success ? (
          <div>
            <p className="push-prompt-kicker">Bildirimler</p>
            <p className="push-prompt-title">Abonelik aktif</p>
            <p className="push-prompt-body">
              Her akşam {pushTime} civarı günün özeti bildirimi gelecek.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="push-prompt-kicker">Akşam baskısı</p>
                <p className="push-prompt-title">Günün özetini kaçırma</p>
                <p className="push-prompt-body">
                  Her akşam {pushTime}&apos;da manşetler ve en kritik başlıklar
                  tek bildirimde gelsin. İstediğin an ayarlardan kapatırsın.
                </p>
              </div>
              <button
                type="button"
                onClick={snooze}
                aria-label="Sonra hatırlat"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="push-prompt-actions">
              <PushNotificationToggle onSubscribed={handleSubscribed} />
              <button
                type="button"
                onClick={snooze}
                className="push-prompt-secondary"
              >
                Sonra
              </button>
              <button
                type="button"
                onClick={dismissForever}
                className="push-prompt-ghost"
              >
                İstemiyorum
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
