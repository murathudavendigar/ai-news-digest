"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { generateArticleSlug } from "@/app/lib/newsUtils";

/**
 * BreakingNewsBanner — "SON DAKİKA" ticker banner
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
      article.publishedAt || article.published_at || article.pubDate,
    );

  // Single story — static banner
  if (stories.length === 1) {
    const story = stories[0];
    const slug = getSlug(story);

    return (
      <div className="w-full overflow-hidden bg-[var(--bg-elevated)] h-[44px] border-b border-[var(--border-subtle)]">
        <Link
          href={slug ? `/news/${slug}` : "#"}
          className="flex items-center h-full px-8 gap-4 max-w-[1200px] mx-auto no-underline animate-in fade-in duration-1000"
        >
          <span className="flex items-center gap-2 shrink-0">
            <span className="animate-pulse inline-block w-2 h-2 rounded-full bg-[var(--danger,#ef4444)]" />
            <span className="text-[11px] font-black tracking-widest uppercase text-[var(--danger,#ef4444)]">
              SON DAKİKA
            </span>
          </span>
          <span className="w-px h-4 shrink-0 bg-[var(--border-subtle)]" />
          <span className="text-sm font-medium text-[var(--text-secondary)] truncate">
            {story.title}
          </span>
        </Link>
      </div>
    );
  }

  // Multiple stories
  return (
    <div className="w-full flex overflow-hidden bg-[var(--bg-elevated)] h-[44px] items-center relative border-b border-[var(--border-subtle)]">
      <div className="flex items-center gap-2 px-8 shrink-0 h-full bg-[var(--bg-elevated)] z-10 relative">
        <span className="animate-pulse inline-block w-2 h-2 rounded-full bg-[var(--danger,#ef4444)]" />
        <span className="text-[11px] font-black tracking-widest uppercase text-[var(--danger,#ef4444)]">
          SON DAKİKA
        </span>
        <span className="w-px h-4 bg-[var(--border-subtle)] ml-4" />
      </div>

      <div className="flex-1 h-full flex items-center overflow-x-auto scrollbar-hide pr-8">
        <div className="flex items-center gap-8 whitespace-nowrap animate-in fade-in duration-1000">
          {stories.map((story, idx) => {
            const slug = getSlug(story);
            return (
              <Link
                key={`${story.article_id || story.title}-${idx}`}
                href={slug ? `/news/${slug}` : "#"}
                className="inline-flex items-center gap-2 h-full shrink-0 no-underline transition-opacity hover:opacity-80"
              >
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  {story.title}
                </span>
                {idx !== stories.length - 1 && (
                  <span className="text-[var(--text-muted)] ml-8">•</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
