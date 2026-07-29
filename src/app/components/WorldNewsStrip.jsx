/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * WorldNewsStrip — Client component
 * Utilizes native CSS horizontal scroll for an intuitive swiping experience.
 */
export default function WorldNewsStrip() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorld() {
      try {
        const res = await fetch("/api/news/international");
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        setArticles((data.articles || data || []).slice(0, 10)); // Fetched a bit more for marquee
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchWorld();
  }, []);

  if (loading) {
    return (
      <section>
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="min-w-[260px] h-[96px] rounded-md bg-[var(--bg-elevated)] animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Dünya&apos;dan
        </h2>
        <span className="flex-1 h-px bg-[var(--border-subtle)]" aria-hidden="true" />
        <Link
          href="/world"
          className="text-[11px] font-black uppercase tracking-widest text-[var(--accent-brand)] no-underline"
        >
          Tümü →
        </Link>
      </div>

      {/* Cards container using Native Scroll */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4">
        {articles.map((article, idx) => (
          <div key={article.slug || `world-${idx}`} className="snap-start shrink-0">
            <WorldCard article={article} />
          </div>
        ))}
      </div>
    </section>
  );
}

function WorldCard({ article }) {
  const slug = article.slug;
  const href = slug ? `/news/${slug}` : "#";
  const externalUrl = article.url || article.link;

  const timeAgo = getTimeAgo(article.publishedAt || article.published_at || article.pubDate);

  return (
    <div className="flex gap-3 p-3 w-[300px] shrink-0 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl no-underline transition-colors relative mx-2">
      {/* Thumbnail */}
      {article.imageUrl || article.image_url ? (
        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-elevated)]">
          <img
            src={article.imageUrl || article.image_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover block"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      ) : null}

      {/* Text content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Source + TR badge */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">
            {article.sourceName || article.source_name || "Kaynak"}
          </span>
          {article.isTranslated && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/15 text-green-600 border border-green-500/30">
              TR
            </span>
          )}
        </div>

        {/* Title */}
        <Link
          href={href}
          className="text-[13px] font-semibold leading-snug text-[var(--text-primary)] line-clamp-2 m-0 no-underline hover:underline"
        >
          {article.title}
        </Link>

        {/* Time + external link */}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] text-[var(--text-muted)]">{timeAgo}</span>
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-[var(--text-muted)] no-underline opacity-60 hover:opacity-100 transition-opacity"
              title="Kaynağa git"
            >
              ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}sa`;
  const days = Math.floor(hours / 24);
  return `${days}g`;
}
