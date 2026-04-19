"use client";

import Image from "next/image";
import { CATEGORY_LABELS } from "@/app/lib/categoryConfig";
import { formatDate } from "@/app/lib/news";
import { generateArticleSlug } from "@/app/lib/newsUtils";
import { useRouter } from "next/navigation";
import { trackArticle } from "@/app/lib/useArticleHistory";
import ArticleReactions from "./ArticleReactions";
import SaveButton from "./SaveButton";

/**
 * HeroNewsCard — featured/first article in large format
 * Full width on mobile, 16:9 thumbnail with overlay gradient.
 */
export default function HeroNewsCard({ article }) {
  const router = useRouter();

  if (!article) return null;

  const slug =
    article.slug ||
    generateArticleSlug(
      article.title,
      article.publishedAt || article.published_at || article.pubDate
    );

  const categoryLabel = article.category?.[0]
    ? CATEGORY_LABELS[article.category[0].toLowerCase()] || article.category[0]
    : null;

  const handleClick = () => {
    trackArticle(article);
    if (slug && slug !== "undefined") {
      router.push(`/news/${slug}`);
    } else {
      console.warn("[HeroNewsCard] Opening external link — slug is missing or 'undefined'.", {
        title: article.title,
        link: article.link || article.url
      });
      window.open(article.link || article.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className="group cursor-pointer relative overflow-hidden"
      style={{
        borderRadius: "var(--radius-xl)",
        background: "var(--bg-card)",
        boxShadow: "var(--shadow-elevated)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video overflow-hidden">
        {article.image_url ? (
          <Image
            src={article.image_url}
            alt={article.title || "News"}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div
            className="flex items-center justify-center w-full h-full"
            style={{ background: "var(--bg-elevated)" }}
          >
            <span className="text-6xl opacity-20">📰</span>
          </div>
        )}

        {/* Overlay gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, transparent 40%, var(--bg-card) 100%)",
          }}
        />

        {/* Category badge — top left */}
        {categoryLabel && (
          <span
            className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm"
            style={{
              background: "var(--accent-primary)",
              color: "var(--text-inverted)",
            }}
          >
            {categoryLabel}
          </span>
        )}

        {/* Save button — top right */}
        <div
          className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-sm transition-all"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <SaveButton article={article} />
        </div>

        {/* External link icon */}
        {article.link && (
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-16 flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
            style={{ background: "rgba(0,0,0,0.4)" }}
            title="Kaynağa Git"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-5 -mt-8 relative z-10">
        <h2
          className="text-xl md:text-2xl font-bold leading-tight mb-2 line-clamp-3 transition-colors group-hover:opacity-90"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-display, Georgia, serif)",
          }}
        >
          {article.title}
        </h2>

        {/* Source + time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              {article.source_name}
            </span>
            <span style={{ color: "var(--text-muted)" }}>·</span>
            <span
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {formatDate(article.pubDate)}
            </span>
          </div>

          {/* Reaction buttons */}
          {slug && (
            <div onClick={(e) => e.stopPropagation()}>
              <ArticleReactions
                articleSlug={slug}
                categorySlug={article.category?.[0]}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
