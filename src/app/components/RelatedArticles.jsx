/* eslint-disable @next/next/no-img-element */
"use client";

import { formatDate } from "@/app/lib/news";
import { generateArticleSlug } from "@/app/lib/newsUtils";
import Link from "next/link";
import { useEffect, useState } from "react";

function resolveHref(article) {
  const slug =
    article.slug ||
    generateArticleSlug(
      article.title,
      article.publishedAt || article.published_at || article.pubDate,
    ) ||
    "";
  const id = article.article_id;
  // slug--id → detay sayfası article_id ile Redis'ten bulur (slug drift'e dayanıklı)
  if (slug && id) return `/news/${slug}--${id}`;
  if (slug) return `/news/${slug}`;
  if (id) return `/news/${id}`;
  return null;
}

export default function RelatedArticles({
  keywords = [],
  currentId,
  title,
}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/related-news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords, currentId, title }),
        });
        const data = await res.json();
        if (!cancelled) setArticles(data.articles || []);
      } catch {
        // optional
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !articles.length) return null;

  return (
    <section className="article-related" aria-label="İlgili haberler">
      <div className="article-section-label">
        <span>Bu konuda</span>
        <span className="article-section-rule" aria-hidden="true" />
      </div>
      <div className="article-related-grid">
        {articles.map((article) => {
          const href = resolveHref(article);
          if (!href) return null;
          return (
            <Link
              key={article.article_id || href}
              href={href}
              className="article-related-card group"
            >
              {article.image_url && (
                <div className="article-related-thumb">
                  <img
                    src={article.image_url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="article-related-title">{article.title}</p>
                <p className="article-related-meta">
                  {article.source_name || article.source}
                  {(article.pubDate || article.publishedAt) &&
                    ` · ${formatDate(article.pubDate || article.publishedAt)}`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
