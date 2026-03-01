"use client";


import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("[app] Hata:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p
          className="text-[7rem] font-black leading-none text-stone-100 dark:text-stone-800 select-none"
          style={{ fontFamily: "Georgia, serif" }}>
          Hata
        </p>

        <div className="-mt-2">
          <div className="h-0.5 w-16 bg-red-500 mx-auto mb-5" />
          <h1
            className="mb-2 text-2xl font-black text-stone-900 dark:text-stone-100"
            style={{ fontFamily: "Georgia, serif" }}>
            Bir Şeyler Ters Gitti
          </h1>
          <p className="mb-3 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            Beklenmedik bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin.
          </p>

          {/* Hata mesajı */}
          {error?.message && (
            <div className="px-4 py-3 mb-6 text-left border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/30 dark:border-red-800">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">
                Hata Detayı
              </p>
              <p className="font-mono text-xs text-red-700 break-all dark:text-red-300">
                {error.message.slice(0, 200)}
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900
                         text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
              Tekrar Dene
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 border border-stone-300 dark:border-stone-600
                         text-sm font-bold text-stone-700 dark:text-stone-300 rounded-lg
                         hover:border-stone-500 transition-colors">
              Ana Sayfa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
