"use client";

import { formatDate } from "@/app/lib/news";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

function slugify(article) {
  if (!article?.title) return article?.article_id || "";
  return (
    article.title
      .toLowerCase()
      .replace(/[^a-z0-9\u00c0-\u024f\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) +
    "--" +
    article.article_id
  );
}

export default function RelatedArticles({ keywords = [], currentId, title }) {
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
        // sessizce geç — ilgili haber opsiyonel
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
    <div className="mt-8 pt-8 border-t border-stone-100 dark:border-stone-800">
      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">
        🔗 Bu Konudaki Diğer Haberler
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={article.article_id}
            href={`/news/${slugify(article)}`}
            className="flex gap-3 p-3 rounded-xl border border-stone-100 dark:border-stone-800
                       bg-stone-50 dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-600
                       transition-all group">
            {article.image_url && (
              <div className="relative w-16 h-16 shrink-0">
                <Image
                  src={article.image_url}
                  alt=""
                  fill
                  sizes="64px"
                  className="rounded-lg object-cover grayscale-20 group-hover:grayscale-0 transition-all"
                  unoptimized
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold leading-snug text-stone-800 dark:text-stone-200 line-clamp-2 group-hover:text-stone-950 dark:group-hover:text-white transition-colors">
                {article.title}
              </p>
              <p className="text-[10px] text-stone-400 mt-1">
                {article.source_name}
                {article.pubDate && ` · ${formatDate(article.pubDate)}`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
