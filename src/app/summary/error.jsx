"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SummaryError({ error, reset }) {
  useEffect(() => {
    console.error("[summary] Hata:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-stone-950">
      <div className="max-w-md text-center">
        <p
          className="mb-2 font-black leading-none select-none text-8xl text-stone-800"
          style={{ fontFamily: "Georgia, serif" }}>
          !
        </p>
        <div className="h-0.5 w-16 bg-red-600 mx-auto mb-5" />
        <h2
          className="mb-2 text-xl font-black text-stone-100"
          style={{ fontFamily: "Georgia, serif" }}>
          Baskı Hazırlanamadı
        </h2>
        <p className="mb-2 text-sm text-stone-500">
          Günün özeti oluşturulurken bir hata oluştu.
        </p>

        {error?.message && (
          <div className="px-4 py-3 mb-6 text-left border border-red-800 rounded-lg bg-red-950/30">
            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">
              Hata
            </p>
            <p className="font-mono text-xs text-red-400 break-all">
              {error.message.slice(0, 150)}
            </p>
          </div>
        )}

        <p className="mb-6 text-xs text-stone-600">
          Her sabah 07:00&apos;de otomatik olarak üretilir. Manuel tetiklemek için
          aşağıyı deneyin.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-stone-100 text-stone-900 text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 border border-stone-700 text-sm font-bold text-stone-400 rounded-lg hover:border-stone-500 transition-colors">
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
