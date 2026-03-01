"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const categories = [
  { slug: "technology", title: "Teknoloji", icon: "💻" },
  { slug: "sports", title: "Spor", icon: "⚽" },
  { slug: "business", title: "Ekonomi", icon: "📈" },
  { slug: "health", title: "Sağlık", icon: "🏥" },
  { slug: "entertainment", title: "Magazin", icon: "🎬" },
  { slug: "politics", title: "Politika", icon: "🏛️" },
  { slug: "world", title: "Dünya", icon: "🌍" },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === "/ozet") return null;

  const isActive = (href) => pathname === href;

  return (
    <>
      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menü"
        className="p-2 transition-colors rounded-lg md:hidden text-stone-400 hover:text-white hover:bg-white/10">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* ── Desktop nav ── */}
      <nav className="hidden md:flex items-center gap-0.5">
        <Link
          href="/"
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-all ${
            isActive("/")
              ? "bg-white text-stone-900"
              : "text-stone-300 hover:text-white hover:bg-white/10"
          }`}>
          Anasayfa
        </Link>

        <div className="w-px h-4 mx-1 bg-white/10" />

        {categories.map((cat) => {
          const href = `/category/${cat.slug}`;
          return (
            <Link
              key={cat.slug}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-all ${
                isActive(href)
                  ? "bg-white text-stone-900 font-semibold"
                  : "text-stone-300 hover:text-white hover:bg-white/10"
              }`}>
              <span className="text-xs">{cat.icon}</span>
              <span>{cat.title}</span>
            </Link>
          );
        })}

        <div className="w-px h-4 mx-1 bg-white/10" />

        <Link
          href="/summary"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold
                     bg-white/10 border border-white/20 text-white
                     hover:bg-white hover:text-stone-900
                     transition-all">
          ☀️ Günün Özeti
        </Link>
      </nav>

      {/* ── Mobile dropdown ── */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 z-50 border-t shadow-2xl md:hidden top-full bg-stone-950 border-white/10">
          <nav className="flex flex-col p-3 gap-0.5">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                isActive("/")
                  ? "bg-white text-stone-900"
                  : "text-stone-300 hover:text-white hover:bg-white/10"
              }`}>
              🏠 <span>Anasayfa</span>
            </Link>

            <div className="h-px my-1 bg-white/10" />

            {categories.map((cat) => {
              const href = `/category/${cat.slug}`;
              return (
                <Link
                  key={cat.slug}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm transition-colors ${
                    isActive(href)
                      ? "bg-white text-stone-900 font-semibold"
                      : "text-stone-300 hover:text-white hover:bg-white/10"
                  }`}>
                  <span>{cat.icon}</span>
                  <span>{cat.title}</span>
                </Link>
              );
            })}

            <div className="h-px my-1 bg-white/10" />

            <Link
              href="/summary"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-all border rounded-lg bg-white/10 border-white/20 hover:bg-white hover:text-stone-900">
              ☀️ <span>Günün Özeti</span>
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
