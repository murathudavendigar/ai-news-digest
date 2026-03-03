"use client";

import { useEffect, useState } from "react";

export default function ReadingProgress({ title }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [readingMode, setReadingMode] = useState(false);

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      setProgress(pct);
      setVisible(scrollTop > 80);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = document.getElementById("article-content");
    if (!el) return;
    if (readingMode) {
      el.style.fontSize = "1.125rem";
      el.style.lineHeight = "1.9";
      el.style.maxWidth = "680px";
      el.style.marginLeft = "auto";
      el.style.marginRight = "auto";
      el.style.transition = "all 0.3s ease";
    } else {
      el.style.fontSize = "";
      el.style.lineHeight = "";
      el.style.maxWidth = "";
      el.style.marginLeft = "";
      el.style.marginRight = "";
    }
  }, [readingMode]);

  return (
    <>
      {/* Amber progress bar — tema rengiyle */}
      <div className="fixed top-0 left-0 right-0 z-200 h-0.5 bg-stone-200 dark:bg-stone-800">
        <div
          className="h-full bg-amber-400"
          style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
        />
      </div>

      {/* Floating toolbar — scroll başlayınca */}
      <div
        className={`fixed z-199 transition-all duration-300 ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
        style={{
          top: "calc(var(--header-height, 60px) + 8px)",
          right: "1.5rem",
        }}>
        <div
          className="flex items-center gap-2
                        bg-white/95 dark:bg-stone-950/95 backdrop-blur-sm
                        border border-stone-200 dark:border-stone-700 rounded-full
                        px-3 py-1.5 shadow-xl shadow-stone-200/50 dark:shadow-stone-950/50">
          {/* Yüzde */}
          <span className="text-[10px] font-black tabular-nums text-amber-500 dark:text-amber-400 min-w-7 text-center">
            %{progress}
          </span>
          <div className="w-px h-3 bg-stone-200 dark:bg-stone-700" />
          {/* Okuma modu toggle */}
          <button
            onClick={() => setReadingMode((v) => !v)}
            title={readingMode ? "Normal moda dön" : "Okuma modunu aç"}
            className={`text-[10px] font-bold transition-colors ${
              readingMode
                ? "text-amber-500 dark:text-amber-400"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
            }`}>
            {readingMode ? "📖 Okuma" : "📄 Okuma"}
          </button>
        </div>
      </div>
    </>
  );
}
