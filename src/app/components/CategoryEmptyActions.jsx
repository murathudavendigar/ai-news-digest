"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import NewsCardSkeleton from "./NewsCardSkeleton";
import NewsFeed from "./NewsFeed";

/**
 * SSR boş döndüğünde client'tan /api/news ile bir kez daha dene.
 * Cold Redis / ISR empty bake durumunda ilk ziyareti kurtarır.
 */
export default function CategoryEmptyActions({ categoryTitle, categorySlug }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [retrying, setRetrying] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [recovered, setRecovered] = useState(null);
  const tried = useRef(false);

  const tryFetch = useCallback(async () => {
    if (!categorySlug) return null;
    const qs = new URLSearchParams({
      category: categorySlug,
      page: "1",
      pageSize: "30",
    });
    const res = await fetch(`/api/news?${qs}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [categorySlug]);

  useEffect(() => {
    if (!categorySlug || tried.current) return;
    tried.current = true;

    let cancelled = false;
    (async () => {
      try {
        const data = await tryFetch();
        if (cancelled) return;
        if (data?.results?.length) {
          setRecovered({
            articles: data.results,
            nextPage: data.nextPage || null,
          });
        }
      } catch (err) {
        console.error("[CategoryEmptyActions] auto-retry:", err);
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categorySlug, tryFetch]);

  async function handleRetry() {
    setRetrying(true);
    try {
      const data = await tryFetch();
      if (data?.results?.length) {
        setRecovered({
          articles: data.results,
          nextPage: data.nextPage || null,
        });
        return;
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error("[CategoryEmptyActions] retry:", err);
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setTimeout(() => setRetrying(false), 800);
    }
  }

  if (bootLoading) {
    return (
      <div className="flex flex-col gap-4 py-2">
        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Haberler yükleniyor…
        </p>
        {[0, 1, 2, 3].map((i) => (
          <NewsCardSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  if (recovered?.articles?.length) {
    return (
      <NewsFeed
        key={`${categorySlug}-recovered`}
        initialArticles={recovered.articles}
        initialNextPage={recovered.nextPage}
        category={categorySlug}
        showTabs={false}
      />
    );
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
        <Link href="/" className="article-text-link">
          Ana sayfa
        </Link>
        <Link href="/digest" className="article-text-link accent">
          Günün özeti
        </Link>
      </div>
    </div>
  );
}
