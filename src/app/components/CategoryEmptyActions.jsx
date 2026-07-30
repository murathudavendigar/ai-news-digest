"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/** Boş kategori — yenile / ana sayfa aksiyonları */
export default function CategoryEmptyActions({ categoryTitle }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    try {
      // Cache miss / kısa boş TTL sonrası taze çek
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setTimeout(() => setRetrying(false), 1200);
    }
  }

  return (
    <div className="page-empty">
      <p className="page-masthead-kicker mb-3">Arşiv</p>
      <h3>Henüz haber yok</h3>
      <p>
        {categoryTitle} kategorisinde şu an manşet bulunamadı. Biraz sonra
        yeniden deneyebilir veya ana akışa dönebilirsin.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying || pending}
          className="border border-[var(--text-primary)] bg-[var(--text-primary)] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--bg-primary)] disabled:opacity-50"
        >
          {retrying || pending ? "Yenileniyor…" : "Yeniden dene"}
        </button>
        <a href="/" className="article-text-link">
          Ana sayfa
        </a>
        <a href="/digest" className="article-text-link accent">
          Günün özeti
        </a>
      </div>
    </div>
  );
}
