"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const categories = [
  { slug: "technology", title: "Teknoloji", icon: "💻" },
  { slug: "sports", title: "Spor", icon: "⚽" },
  { slug: "business", title: "Ekonomi", icon: "📈" },
  { slug: "health", title: "Sağlık", icon: "🏥" },
  { slug: "entertainment", title: "Magazin", icon: "🎬" },
  { slug: "politics", title: "Politika", icon: "🏛️" },
  { slug: "world", title: "Dünya", icon: "🌍" },
];

/* ─── İkonlar ─────────────────────────────────────────────────────────── */
function HomeIcon({ active }) {
  return active ? (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  ) : (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}
function SunIcon({ active }) {
  return active ? (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 6.166a.75.75 0 011.06-1.06l1.591 1.59a.75.75 0 01-1.06 1.061L6.166 6.166z" />
    </svg>
  ) : (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  );
}
function BookmarkIcon({ active }) {
  return active ? (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" />
    </svg>
  ) : (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
      />
    </svg>
  );
}
function SettingsIcon({ active }) {
  return active ? (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.987.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

export default function Navigation() {
  const [catOpen, setCatOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setCatOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (catOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [catOpen]);

  if (pathname === "/ozet") return null;

  const isActive = (href) => pathname === href;
  const isCatActive = pathname.startsWith("/category");

  return (
    <>
      {/* ═══════════════════════════════════
          DESKTOP NAV
      ═══════════════════════════════════ */}
      <nav className="hidden md:flex items-center gap-0.5">
        <Link
          href="/"
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-all ${
            isActive("/")
              ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900"
              : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10"
          }`}>
          Anasayfa
        </Link>

        <div className="w-px h-4 mx-1 bg-stone-200 dark:bg-white/10" />

        {categories.map((cat) => {
          const href = `/category/${cat.slug}`;
          return (
            <Link
              key={cat.slug}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-all ${
                isActive(href)
                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-semibold"
                  : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10"
              }`}>
              <span className="text-xs">{cat.icon}</span>
              <span>{cat.title}</span>
            </Link>
          );
        })}

        <div className="w-px h-4 mx-1 bg-stone-200 dark:bg-white/10" />

        <Link
          href="/summary"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold
                     bg-stone-100 dark:bg-white/10 border border-stone-200 dark:border-white/20
                     text-stone-700 dark:text-white
                     hover:bg-stone-900 dark:hover:bg-white hover:text-white dark:hover:text-stone-900 transition-all">
          ☀️ Günün Özeti
        </Link>
      </nav>

      {/* ═══════════════════════════════════
          MOBİL BOTTOM TAB BAR
      ═══════════════════════════════════ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden
                   bg-white/95 dark:bg-stone-950/95 backdrop-blur-xl border-t border-stone-200 dark:border-white/[0.08]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around h-16 px-0.5">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-xl transition-all ${
              isActive("/")
                ? "text-amber-600 dark:text-amber-400"
                : "text-stone-400 dark:text-stone-500"
            }`}>
            <HomeIcon active={isActive("/")} />
            <span className="text-[9px] font-semibold">Anasayfa</span>
          </Link>

          <button
            onClick={() => setCatOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-xl transition-all ${
              isCatActive
                ? "text-amber-600 dark:text-amber-400"
                : "text-stone-400 dark:text-stone-500"
            }`}>
            <GridIcon />
            <span className="text-[9px] font-semibold">Kategoriler</span>
          </button>

          <Link
            href="/summary"
            className={`flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-xl transition-all ${
              isActive("/summary")
                ? "text-amber-600 dark:text-amber-400"
                : "text-stone-400 dark:text-stone-500"
            }`}>
            <SunIcon active={isActive("/summary")} />
            <span className="text-[9px] font-semibold">Özet</span>
          </Link>

          <Link
            href="/saved"
            className={`flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-xl transition-all ${
              isActive("/saved")
                ? "text-amber-600 dark:text-amber-400"
                : "text-stone-400 dark:text-stone-500"
            }`}>
            <BookmarkIcon active={isActive("/saved")} />
            <span className="text-[9px] font-semibold">Kayıtlı</span>
          </Link>

          <Link
            href="/settings"
            className={`flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-xl transition-all ${
              isActive("/settings")
                ? "text-amber-600 dark:text-amber-400"
                : "text-stone-400 dark:text-stone-500"
            }`}>
            <SettingsIcon active={isActive("/settings")} />
            <span className="text-[9px] font-semibold">Ayarlar</span>
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════
          KATEGORİ SHEET
      ═══════════════════════════════════ */}
      {catOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setCatOpen(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white border-t shadow-2xl dark:bg-stone-950 rounded-t-3xl border-stone-200 dark:border-white/10"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom) + 4.5rem)",
            }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-700" />
            </div>

            <div className="flex items-center justify-between px-5 py-2">
              <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                Kategoriler
              </p>
              <button
                onClick={() => setCatOpen(false)}
                className="flex items-center justify-center rounded-full w-7 h-7 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 px-4 pb-3 pt-1">
              <Link
                href="/"
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all ${
                  isActive("/")
                    ? "bg-amber-400/10 border-amber-400/40 text-amber-600 dark:text-amber-400"
                    : "bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700"
                }`}>
                <span className="text-xl">🏠</span>
                <span className="text-sm font-semibold">Tümü</span>
              </Link>

              {categories.map((cat) => {
                const href = `/category/${cat.slug}`;
                return (
                  <Link
                    key={cat.slug}
                    href={href}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all ${
                      isActive(href)
                        ? "bg-amber-400/10 border-amber-400/40 text-amber-600 dark:text-amber-400"
                        : "bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700"
                    }`}>
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-sm font-semibold">{cat.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
