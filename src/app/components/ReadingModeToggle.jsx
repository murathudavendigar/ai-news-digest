"use client";

import { useEffect, useState } from "react";

const KEY = "haberai:reading-mode";

/**
 * Haber detayında okuma boyutu (normal / large).
 */
export default function ReadingModeToggle() {
  const [size, setSize] = useState("normal");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "large" || saved === "normal") setSize(saved);
    } catch {}
  }, []);

  useEffect(() => {
    const root = document.querySelector(".article-detail");
    if (!root) return;
    root.dataset.reading = size;
    try {
      localStorage.setItem(KEY, size);
    } catch {}
  }, [size]);

  return (
    <div
      className="inline-flex items-center border border-[var(--border-subtle)]"
      role="group"
      aria-label="Yazı boyutu"
    >
      {[
        { id: "normal", label: "A" },
        { id: "large", label: "A+" },
      ].map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setSize(opt.id)}
          className={`px-2.5 py-1 text-xs font-bold ${
            size === opt.id
              ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
              : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
          aria-pressed={size === opt.id}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
