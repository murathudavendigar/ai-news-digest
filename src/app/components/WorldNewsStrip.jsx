/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * WorldNewsStrip — Client component
 * Horizontal scroll (mobile) / 3-col grid (desktop).
 * Clean flat design with thumbnail-left cards.
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
        setArticles((data.articles || data || []).slice(0, 6));
      } catch {
        // Silent fail — strip just won't show
      } finally {
        setLoading(false);
      }
    }
    fetchWorld();
  }, []);

  if (loading) {
    return (
      <section>
        <div style={{ display: "flex", gap: "12px", overflow: "hidden" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                minWidth: "260px",
                height: "96px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-elevated)",
                animation: "pulse 2s infinite",
              }}
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: 0,
          }}
        >
          <span>🌍</span> Dünya&apos;dan
        </h2>
        <Link
          href="/world"
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--accent-brand)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          Tümünü gör →
        </Link>
      </div>

      {/* Cards container */}
      <div className="world-strip-grid scrollbar-hide">
        {articles.map((article, idx) => (
          <WorldCard key={article.slug || `world-${idx}`} article={article} />
        ))}
      </div>

      <style jsx>{`
        .world-strip-grid {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .world-strip-grid::-webkit-scrollbar {
          display: none;
        }
        @media (min-width: 768px) {
          .world-strip-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            overflow-x: visible;
          }
        }
      `}</style>
    </section>
  );
}

function WorldCard({ article }) {
  const slug = article.slug;
  const href = slug ? `/news/${slug}` : "#";
  const externalUrl = article.url || article.link;

  const timeAgo = getTimeAgo(article.publishedAt || article.published_at || article.pubDate);

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "12px",
        minWidth: "260px",
        flexShrink: 0,
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        textDecoration: "none",
        transition: "border-color 0.2s",
        position: "relative",
      }}
    >
      {/* Thumbnail */}
      {article.imageUrl || article.image_url ? (
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "8px",
            overflow: "hidden",
            flexShrink: 0,
            background: "var(--bg-elevated)",
          }}
        >
          <img
            src={article.imageUrl || article.image_url}
            alt=""
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      ) : null}

      {/* Text content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Source + TR badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <span
            style={{
              fontSize: "9px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "2px 6px",
              borderRadius: "4px",
              background: "var(--bg-elevated)",
              color: "var(--text-muted)",
            }}
          >
            {article.sourceName || article.source_name || "Kaynak"}
          </span>
          {article.isTranslated && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(22, 163, 74, 0.15)",
                color: "var(--success)",
                border: "1px solid rgba(22, 163, 74, 0.3)",
              }}
            >
              TR
            </span>
          )}
        </div>

        {/* Title */}
        <Link
          href={href}
          style={{
            fontSize: "13px",
            fontWeight: 600,
            lineHeight: 1.4,
            color: "var(--text-primary)",
            textDecoration: "none",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            margin: 0,
          }}
        >
          {article.title}
        </Link>

        {/* Time + external link */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            {timeAgo}
          </span>
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                textDecoration: "none",
                opacity: 0.6,
                transition: "opacity 0.2s",
              }}
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
