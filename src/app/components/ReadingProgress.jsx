"use client";

import { useState, useEffect } from "react";

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
      setVisible(scrollTop > 50);
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
      el.style.maxWidth = "720px";
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
      {/* Progress bar - en üstte sabit */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-gray-200 dark:bg-gray-800">
        <div
          className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500"
          style={{ width: `${progress}%`, transition: "width 0.15s ease" }}
        />
      </div>

      {/* Toolbar */}
      {visible && (
        <div
          className="fixed top-1 left-0 right-0 z-[99]
                        bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm
                        border-b border-gray-200 dark:border-gray-800
                        px-4 py-2 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate max-w-[60%]">
            {title}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 tabular-nums dark:text-gray-500">
              %{progress}
            </span>
            <button
              onClick={() => setReadingMode((v) => !v)}
              className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                readingMode
                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}>
              {readingMode ? "📖 Okuma Modu" : "📄 Okuma Modu"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
