"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { generateArticleSlug } from "@/app/lib/newsUtils";

/**
 * BreakingNewsBanner — "🔴 SON DAKİKA" ticker banner
 *
 * Self-fetching: queries /api/news for recent articles,
 * filters by breaking keywords. Shows nothing if none found.
 */
export default function BreakingNewsBanner({ stories: externalStories }) {
  const [stories, setStories] = useState(externalStories || []);

  useEffect(() => {
    // If stories already provided via props, skip fetching
    if (externalStories && externalStories.length > 0) return;

    async function fetchBreaking() {
      try {
        const res = await fetch("/api/news?page=1&pageSize=15");
        if (!res.ok) return;
        const data = await res.json();
        const articles = data.results || [];

        const ONE_HOUR = 60 * 60 * 1000;
        const now = Date.now();
        const keywords = ["son dakika", "flaş", "breaking"];

        const breaking = articles.filter((a) => {
          const title = (a.title || "").toLowerCase();
          const hasKeyword = keywords.some((kw) => title.includes(kw));
          if (!hasKeyword) return false;

          const pubDate = a.pubDate || a.publishedAt || a.published_at;
          if (!pubDate) return hasKeyword;

          const pub = new Date(pubDate).getTime();
          return now - pub < ONE_HOUR;
        });

        setStories(breaking);
      } catch {
        // Silent fail
      }
    }
    fetchBreaking();
  }, [externalStories]);

  if (!stories || stories.length === 0) return null;

  const getSlug = (article) =>
    article.slug ||
    generateArticleSlug(
      article.title,
      article.publishedAt || article.published_at || article.pubDate
    );

  // Single story — static banner
  if (stories.length === 1) {
    const story = stories[0];
    const slug = getSlug(story);

    return (
      <div
        style={{
          width: "100%",
          overflow: "hidden",
          background: "var(--accent-primary)",
          height: "44px",
        }}
      >
        <Link
          href={slug ? `/news/${slug}` : "#"}
          style={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            padding: "0 16px",
            gap: "12px",
            maxWidth: "1200px",
            margin: "0 auto",
            textDecoration: "none",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <span
              className="animate-blink"
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#fff",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "var(--text-inverted)",
              }}
            >
              SON DAKİKA
            </span>
          </span>
          <span style={{ width: "1px", height: "20px", flexShrink: 0, background: "rgba(255,255,255,0.3)" }} />
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-inverted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {story.title}
          </span>
        </Link>
      </div>
    );
  }

  // Multiple stories — ticker animation
  const doubled = [...stories, ...stories];

  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden",
        background: "var(--accent-primary)",
        height: "44px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
        {/* Fixed badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "0 16px",
            flexShrink: 0,
            height: "100%",
            background: "var(--accent-primary)",
            zIndex: 2,
            boxShadow: "4px 0 12px var(--accent-primary)",
          }}
        >
          <span
            className="animate-blink"
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#fff",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--text-inverted)",
            }}
          >
            SON DAKİKA
          </span>
          <span style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.3)" }} />
        </div>

        {/* Scrolling ticker */}
        <div style={{ overflow: "hidden", flex: 1, height: "100%" }}>
          <div
            className="animate-ticker"
            style={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              whiteSpace: "nowrap",
            }}
          >
            {doubled.map((story, idx) => {
              const slug = getSlug(story);
              return (
                <Link
                  key={`${story.article_id || story.title}-${idx}`}
                  href={slug ? `/news/${slug}` : "#"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "0 24px",
                    height: "100%",
                    flexShrink: 0,
                    textDecoration: "none",
                    transition: "opacity 0.2s",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--text-inverted)",
                    }}
                  >
                    {story.title}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>•</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
