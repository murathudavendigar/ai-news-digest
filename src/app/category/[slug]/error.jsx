"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CategoryError({ error, reset }) {
  useEffect(() => {
    console.error("[category] Hata:", error);
  }, [error]);

  return (
    <div className="page-shell flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="page-masthead-kicker mb-3">Kategori</p>
        <div className="mx-auto mb-5 h-0.5 w-16 bg-[var(--danger)]" />
        <h2 className="page-masthead-title mb-2 !text-[1.5rem]">
          Haberler yüklenemedi
        </h2>
        <p className="mb-6 text-sm text-[var(--text-secondary)]">
          Bu kategori açılırken bir hata oluştu. Biraz sonra tekrar dene.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="border border-[var(--text-primary)] bg-[var(--text-primary)] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--bg-primary)]"
          >
            Tekrar dene
          </button>
          <Link
            href="/"
            className="border border-[var(--border-subtle)] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)] no-underline"
          >
            Ana sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
