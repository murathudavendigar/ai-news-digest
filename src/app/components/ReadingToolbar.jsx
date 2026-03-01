"use client";

import { useState, useEffect, useCallback } from "react";

function IconButton({ onClick, title, active = false, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all text-sm ${
        active
          ? "bg-amber-400 text-stone-950"
          : "text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-stone-200"
      }`}>
      {children}
    </button>
  );
}

export default function ReadingToolbar({ title, articleUrl }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [fontSize, setFontSize] = useState(1); // 0=sm 1=base 2=lg
  const [copied, setCopied] = useState(false);

  // ── Scroll tracker ──────────────────────────────────────────
  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      setProgress(pct);
      setVisible(scrollTop > 120);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Okuma modu ───────────────────────────────────────────────
  useEffect(() => {
    const el = document.getElementById("article-content");
    if (!el) return;
    const sizes = ["0.9rem", "1rem", "1.2rem"];
    const leading = ["1.7", "1.8", "1.95"];
    el.style.fontSize = readingMode ? sizes[fontSize] : "";
    el.style.lineHeight = readingMode ? leading[fontSize] : "";
    el.style.maxWidth = readingMode ? "680px" : "";
    el.style.margin = readingMode ? "0 auto" : "";
    el.style.transition = "all 0.25s ease";
  }, [readingMode, fontSize]);

  // ── Yazı boyutu sadece okuma modundayken etkin ───────────────
  const cycleFont = useCallback(() => {
    if (!readingMode) setReadingMode(true);
    setFontSize((f) => (f + 1) % 3);
  }, [readingMode]);

  // ── Paylaş / kopyala ─────────────────────────────────────────
  const share = useCallback(async () => {
    const url = articleUrl || window.location.href;
    const shareData = { title, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  }, [title, articleUrl]);

  const FONT_LABELS = ["A−", "A", "A+"];

  return (
    <>
      {/* Progress bar — en üstte ince amber çizgi */}
      <div className="fixed top-0 left-0 right-0 z-[200] h-0.5 bg-stone-200 dark:bg-stone-800 pointer-events-none">
        <div
          className="h-full bg-amber-400 transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating toolbar */}
      <div
        className={`fixed z-[199] right-4 md:right-6 transition-all duration-300 ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        style={{ top: "calc(var(--header-height, 64px) + 12px)" }}>
        <div
          className="flex flex-col gap-1 p-1.5 rounded-2xl
                        bg-white dark:bg-stone-900
                        border border-stone-200 dark:border-stone-700
                        shadow-xl shadow-stone-900/10 dark:shadow-stone-950/40">
          {/* İlerleme yüzdesi */}
          <div className="flex items-center justify-center h-8 px-2">
            <span className="text-[11px] font-black tabular-nums text-amber-500 min-w-[26px] text-center">
              {progress}%
            </span>
          </div>

          <div className="h-px mx-1 bg-stone-100 dark:bg-stone-800" />

          {/* Okuma modu */}
          <IconButton
            onClick={() => setReadingMode((v) => !v)}
            active={readingMode}
            title="Okuma Modu">
            📖
          </IconButton>

          {/* Yazı boyutu */}
          <IconButton
            onClick={cycleFont}
            active={readingMode}
            title={`Yazı Boyutu: ${FONT_LABELS[fontSize]}`}>
            <span className="text-[11px] font-black">
              {FONT_LABELS[fontSize]}
            </span>
          </IconButton>

          <div className="h-px mx-1 bg-stone-100 dark:bg-stone-800" />

          {/* Paylaş */}
          <IconButton
            onClick={share}
            title={copied ? "Kopyalandı!" : "Paylaş / Kopyala"}>
            {copied ? (
              <span className="text-emerald-500">✓</span>
            ) : (
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            )}
          </IconButton>

          {/* Yazdır */}
          <IconButton onClick={() => window.print()} title="Yazdır">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
          </IconButton>
        </div>
      </div>
    </>
  );
}
