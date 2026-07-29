"use client";

import { siteConfig } from "@/app/lib/siteConfig";
import { useEffect, useState } from "react";

const DISMISS_KEY = "haberai:pwa-install-dismissed";
const SNOOZE_KEY = "haberai:pwa-install-snooze";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

function isIOS() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isInStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function shouldShow() {
  if (typeof window === "undefined") return false;
  if (document.documentElement.dataset.onboardingActive === "1") return false;
  if (localStorage.getItem("haberai:onboarding-v1") !== "1") return false;
  if (localStorage.getItem(DISMISS_KEY) === "1") return false;
  const snoozeUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
  if (snoozeUntil && Date.now() < snoozeUntil) return false;
  if (isInStandaloneMode()) return false;
  if (!window.matchMedia("(max-width: 768px)").matches) return false;
  return true;
}

export default function PWAInstallPrompt() {
  const [{ show, isIos }, setUI] = useState({ show: false, isIos: false });
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (!shouldShow()) return;

    const ios = isIOS();

    if (ios) {
      const isSafari =
        /safari/i.test(navigator.userAgent) &&
        !/crios|fxios/i.test(navigator.userAgent);
      if (!isSafari) return;
      const t = setTimeout(() => {
        if (shouldShow()) setUI({ show: true, isIos: true });
      }, 22000);
      return () => clearTimeout(t);
    }

    let timer;
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      timer = setTimeout(() => {
        if (shouldShow()) setUI({ show: true, isIos: false });
      }, 22000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const dismissForever = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    localStorage.removeItem(SNOOZE_KEY);
    setUI({ show: false, isIos });
  };

  const snooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    setUI({ show: false, isIos });
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
      localStorage.removeItem(SNOOZE_KEY);
    }
    setDeferredPrompt(null);
    setUI({ show: false, isIos });
  };

  if (!show) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-80 bg-black/40 md:hidden"
        onClick={snooze}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-labelledby="pwa-install-title"
        className="fixed bottom-0 left-0 right-0 z-90 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
        </div>

        <div className="px-5 pb-6 pt-2">
          <div className="mb-4 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-192.png"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 border border-[var(--border-subtle)]"
            />
            <div>
              <p className="text-sm font-black text-[var(--text-primary)]">
                {siteConfig.name}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {siteConfig.tagline}
              </p>
            </div>
          </div>

          <h2
            id="pwa-install-title"
            className="mb-1 text-lg font-black text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Ana ekrana ekle
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
            Daha hızlı açılır, tam ekran çalışır ve bildirim alabilirsin.
          </p>

          {isIos ? (
            <div className="mb-4 space-y-3 border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Nasıl eklenir
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                1. Alt çubuktaki <strong className="text-[var(--text-primary)]">Paylaş</strong> ikonuna dokun
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                2. <strong className="text-[var(--text-primary)]">Ana Ekrana Ekle</strong> seç
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                3. Sağ üstten <strong className="text-[var(--text-primary)]">Ekle</strong>
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={install}
              className="mb-3 w-full border border-[var(--text-primary)] bg-[var(--text-primary)] py-3.5 text-[11px] font-black uppercase tracking-widest text-[var(--bg-primary)] active:scale-[0.98]"
            >
              Yükle
            </button>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={snooze}
              className="flex-1 border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-3 text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]"
            >
              Şimdi değil
            </button>
            <button
              type="button"
              onClick={dismissForever}
              className="flex-1 border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-3 text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]"
            >
              Bir daha gösterme
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
