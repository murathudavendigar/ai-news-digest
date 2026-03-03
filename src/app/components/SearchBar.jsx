"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Escape ile kapat
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      {/* Arama ikonu butonu */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Ara (⌘K)"
        className="flex items-center justify-center w-8 h-8 transition-all rounded-lg text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-white/10">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>

      {/* Arama overlay */}
      {open && (
        <div
          className="fixed inset-0 z-300 flex items-start justify-center pt-[15vh] px-4"
          onClick={() => {
            setOpen(false);
            setQuery("");
          }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm" />

          {/* Search modal */}
          <div
            className="relative w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}>
            <form
              onSubmit={submit}
              className="flex items-center gap-3 bg-stone-900 border border-stone-700
                         rounded-2xl px-4 py-3.5 shadow-2xl shadow-stone-950/50">
              <svg
                className="w-5 h-5 text-stone-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Haberlerde ara..."
                className="flex-1 text-base bg-transparent outline-none text-stone-100 placeholder-stone-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="transition-colors text-stone-500 hover:text-stone-300 shrink-0">
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
              )}
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-400 text-stone-950 text-xs font-black rounded-lg
                           hover:bg-amber-300 transition-colors shrink-0">
                Ara
              </button>
            </form>

            <p className="hidden mt-3 text-xs text-center md:block text-stone-600">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 text-[10px] font-mono">
                ESC
              </kbd>{" "}
              ile kapat ·{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 text-[10px] font-mono">
                ⌘K
              </kbd>{" "}
              ile aç
            </p>
          </div>
        </div>
      )}
    </>
  );
}
