"use client";

import { siteConfig } from "@/app/lib/siteConfig";
import { useEffect, useState } from "react";

const STORAGE_KEY = "pwa-install-dismissed";

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

export default function PWAInstallPrompt() {
  const [{ show, isIos }, setUI] = useState({ show: false, isIos: false });
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Daha önce "gösterme" dediyse çıkış
    if (localStorage.getItem(STORAGE_KEY)) return;
    // PWA olarak zaten açıksa gösterme
    if (isInStandaloneMode()) return;
    // Sadece mobil
    if (!window.matchMedia("(max-width: 768px)").matches) return;

    const ios = isIOS();

    if (ios) {
      // iOS: sadece Safari'de (Chrome/Firefox'ta install desteklenmiyor)
      const isSafari =
        /safari/i.test(navigator.userAgent) &&
        !/crios|fxios/i.test(navigator.userAgent);
      if (!isSafari) return;
      // Küçük gecikme — sayfa yerleştikten sonra göster
      const t = setTimeout(() => setUI({ show: true, isIos: true }), 2500);
      return () => clearTimeout(t);
    } else {
      // Android/Chrome: beforeinstallprompt eventini yakala
      let timer;
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        timer = setTimeout(() => setUI({ show: true, isIos: false }), 2500);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        clearTimeout(timer);
      };
    }
  }, []);

  const dismiss = (permanent = false) => {
    if (permanent) localStorage.setItem(STORAGE_KEY, "1");
    setUI({ show: false, isIos });
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") localStorage.setItem(STORAGE_KEY, "1");
    setDeferredPrompt(null);
    setUI({ show: false, isIos });
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-80 bg-black/50 backdrop-blur-sm md:hidden"
        onClick={() => dismiss(false)}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-90 md:hidden
                   bg-stone-950 border-t border-white/10 rounded-t-3xl shadow-2xl
                   animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-stone-700" />
        </div>

        <div className="px-6 pb-8 pt-3">
          {/* Header */}
          <div className="flex items-center gap-4 mb-5">
            {/* App icon */}
            <div
              className="shrink-0 w-14 h-14 rounded-2xl overflow-hidden
                            bg-linear-to-br from-amber-600 to-amber-400
                            flex items-center justify-center shadow-lg">
              <span
                className="text-4xl font-black text-stone-900 leading-none"
                style={{ fontFamily: "Georgia, serif" }}>
                H
              </span>
            </div>
            <div>
              <p className="text-base font-black text-white">
                {siteConfig.name}
              </p>
              <p className="text-xs text-stone-400">{siteConfig.tagline}</p>
            </div>
          </div>

          <h2 className="text-lg font-black text-white mb-1">
            Ana Ekrana Ekle
          </h2>
          <p className="text-sm text-stone-400 mb-5 leading-relaxed">
            Uygulamayı ana ekranına ekleyerek daha hızlı erişebilirsin. Tam
            ekran açılır, bildirim alabilirsin.
          </p>

          {isIos ? (
            /* iOS talimatları */
            <div className="bg-stone-900 border border-white/6 rounded-2xl p-4 mb-5 space-y-3">
              <p className="text-[11px] font-black text-stone-500 uppercase tracking-widest mb-3">
                Nasıl Eklenir
              </p>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-amber-400">1</span>
                </div>
                <p className="text-sm text-stone-300">
                  Tarayıcının alt çubuğundaki{" "}
                  <span className="inline-flex items-center gap-0.5 font-bold text-white">
                    Paylaş
                    <svg
                      className="w-3.5 h-3.5 inline ml-0.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </span>{" "}
                  butonuna dokun
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-amber-400">2</span>
                </div>
                <p className="text-sm text-stone-300">
                  <span className="font-bold text-white">
                    &ldquo;Ana Ekrana Ekle&rdquo;
                  </span>{" "}
                  seçeneğini seç
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-amber-400">3</span>
                </div>
                <p className="text-sm text-stone-300">
                  Sağ üstteki{" "}
                  <span className="font-bold text-white">
                    &ldquo;Ekle&rdquo;
                  </span>{" "}
                  butonuna dokun
                </p>
              </div>
            </div>
          ) : (
            /* Android — native install */
            <button
              onClick={install}
              className="w-full py-3.5 rounded-2xl font-black text-stone-900 text-sm
                         bg-linear-to-r from-amber-500 to-amber-400
                         mb-3 active:scale-[0.98] transition-transform shadow-lg">
              Yükle — Ücretsiz
            </button>
          )}

          {/* Alt butonlar */}
          <div className="flex gap-3">
            <button
              onClick={() => dismiss(false)}
              className="flex-1 py-3 rounded-2xl text-sm font-bold
                         bg-stone-900 border border-white/10 text-stone-400
                         active:opacity-70 transition-opacity">
              Şimdi Değil
            </button>
            <button
              onClick={() => dismiss(true)}
              className="flex-1 py-3 rounded-2xl text-sm font-bold
                         bg-stone-900 border border-white/10 text-stone-600
                         active:opacity-70 transition-opacity">
              Bir Daha Gösterme
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
