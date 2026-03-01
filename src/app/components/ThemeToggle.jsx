"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();


  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    // setTimeout(0) → bir sonraki task'a erteler, effect body'sinin dışına çıkar
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  if (!mounted) {
    // Placeholder — layout shift olmadan aynı boyutta boş kutu
    return <div className="w-8 h-8" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      aria-label={isDark ? "Açık tema" : "Koyu tema"}
      className="flex items-center justify-center w-8 h-8 transition-all duration-200 rounded-lg text-stone-400 hover:text-white hover:bg-white/10">
      {isDark ? (
        /* Güneş */
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
          />
        </svg>
      ) : (
        /* Ay */
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
