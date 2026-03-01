"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CategoryError({ error, reset }) {
  useEffect(() => {
    console.error("[category] Hata:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="mb-3 text-5xl">⚡</p>
        <div className="h-0.5 w-16 bg-red-500 mx-auto mb-5" />
        <h2
          className="mb-2 text-xl font-black text-stone-900 dark:text-stone-100"
          style={{ fontFamily: "Georgia, serif" }}>
          Haberler Yüklenemedi
        </h2>
        <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
          Bu kategori yüklenirken bir hata oluştu.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 border border-stone-300 dark:border-stone-600 text-sm font-bold text-stone-700 dark:text-stone-300 rounded-lg hover:border-stone-500 transition-colors">
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
