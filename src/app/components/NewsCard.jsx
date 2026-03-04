"use client";

import { CATEGORY_LABELS } from "@/app/lib/categoryConfig";
import { formatDate } from "@/app/lib/news";
import { CREDIBILITY_CONFIG, getSourceTier } from "@/app/lib/sourceCredibility";
import { isArticleRead, trackArticle } from "@/app/lib/useArticleHistory";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import BookmarkButton from "./BookmarkButton";

const VERDICT_COLORS = {
  reliable: "text-emerald-400 bg-emerald-950/60 border-emerald-700",
  questionable: "text-amber-400 bg-amber-950/60 border-amber-700",
  unreliable: "text-red-400 bg-red-950/60 border-red-700",
};

const VERDICT_LABELS = {
  reliable: "Güvenilir",
  questionable: "Şüpheli",
  unreliable: "Güvenilmez",
};

const SCORE_LABELS = {
  reliability: "Güvenilirlik",
  neutrality: "Tarafsızlık",
  emotionalLanguage: "Duygusal Dil",
  sourceReputation: "Kaynak",
};

function readingTime(article) {
  const text = [article.title, article.description].filter(Boolean).join(" ");
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function categoryLabel(slug) {
  if (!slug) return null;
  return CATEGORY_LABELS[slug.toLowerCase()] ?? slug;
}

export default function NewsCard({
  article,
  priority = false,
  featured = false,
}) {
  const [scorePreview, setScorePreview] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRead, setIsRead] = useState(false);

  // Okunma durumunu localStorage'dan al (hydration sonrası)
  useEffect(() => {
    setIsRead(isArticleRead(article.article_id));
  }, [article.article_id]);

  const articleSlug = article.title
    ? article.title
        .toLowerCase()
        .replace(/[^a-z0-9\u00c0-\u024f\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80) +
      "--" +
      article.article_id
    : article.article_id;

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = `${window.location.origin}/news/${articleSlug}`;
    const shareData = { title: article.title, url: fullUrl };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Kullanıcı iptal etti veya izin yok — sessizce yoksay
    }
  };

  const handleMouseEnter = useCallback(async () => {
    setHovered(true);
    // Her iki cache'i ısıt — article-insight summary + analyze — kullanıcı tıklarsa anında hazır olsun
    // article-insight ısınması (fire-and-forget, sonucu kullanmıyoruz burada)
    const articleId = article.article_id;
    const articleContext = {
      articleId,
      title: article.title,
      description: article.description ?? undefined,
      sourceUrl: article.link,
      sourceName: article.source_name ?? undefined,
      language: article.language ?? undefined,
      category: article.category ?? undefined,
      keywords: article.keywords ?? undefined,
    };
    fetch("/api/article-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ article: articleContext }),
    }).catch(() => {});

    // Analyze cache'den sadece score'u çek — kart üzerinde göster
    if (scorePreview !== null) return;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.fromCache && data.score) setScorePreview(data.score);
    } catch {}
  }, [article, scorePreview]);

  const verdictCfg = scorePreview
    ? {
        color:
          VERDICT_COLORS[scorePreview.verdict] || VERDICT_COLORS.questionable,
        label: VERDICT_LABELS[scorePreview.verdict] || "Şüpheli",
      }
    : null;

  // 🔥 badge eşiği
  const isHot = scorePreview?.overallScore >= 80;

  // Kaynak güvenilirliği
  const sourceTier = getSourceTier(article.source_name);
  const credCfg = sourceTier ? CREDIBILITY_CONFIG[sourceTier] : null;

  return (
    <div
      className={`relative transition-opacity duration-300 ${isRead ? "opacity-60" : "opacity-100"}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}>
      <Link
        href={`/news/${articleSlug}`}
        onClick={() => {
          trackArticle(article);
          setIsRead(true);
        }}
        className={`overflow-hidden transition-all duration-300
                   bg-white border shadow-sm group dark:bg-stone-900
                   border-stone-200 dark:border-stone-800 rounded-2xl
                   hover:shadow-lg hover:border-stone-400 dark:hover:border-stone-600
                   active:scale-[0.99] ${featured ? "block" : "flex md:block"}`}>
        {/* Görsel — featured/desktop: tam genişlik; normal mobil: sol thumbnail */}
        <div
          className={`relative overflow-hidden bg-stone-100 dark:bg-stone-800 ${
            featured
              ? "w-full h-44 md:h-52 shrink-0"
              : "self-stretch w-28 shrink-0 md:w-full md:h-48"
          }`}>
          {article.image_url ? (
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 112px, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              loading={priority ? "eager" : "lazy"}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-stone-100 dark:bg-stone-800">
              <span className="text-5xl opacity-20">📰</span>
            </div>
          )}

          {/* Gradient */}
          <div
            className={`absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-transparent ${featured ? "block" : "hidden md:block"}`}
          />

          {/* Kaynak badge */}
          <div
            className={`absolute top-3 left-3 items-center gap-1.5 px-2.5 py-1
                          bg-black/60 backdrop-blur-sm rounded-full ${featured ? "flex" : "hidden md:flex"}`}>
            {article.source_icon && (
              <Image
                src={article.source_icon}
                width={14}
                height={14}
                className="rounded-full"
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <span className="text-[10px] font-bold text-white tracking-wide">
              {article.source_name}
            </span>
            {credCfg && (
              <span title={credCfg.label} className="text-[10px]">
                {credCfg.badge}
              </span>
            )}
          </div>

          {/* Skor badge — desktop (score yüklenince her zaman görünür) */}
          {scorePreview && (
            <div
              className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5
                          rounded-full border text-[10px] font-black backdrop-blur-sm
                          ${verdictCfg.color}`}>
              {isHot && <span className="mr-0.5">🔥</span>}
              {scorePreview.overallScore}
              <span className="hidden font-medium opacity-80 md:inline">
                {verdictCfg.label}
              </span>
            </div>
          )}

          {/* Kategori chip */}
          {article.category?.[0] && (
            <div
              className={`absolute bottom-3 left-3 ${featured ? "block" : "hidden md:block"}`}>
              <span
                className="text-[9px] font-black uppercase tracking-widest
                               px-2 py-0.5 bg-stone-950/80 text-stone-300 rounded-sm">
                {categoryLabel(article.category[0])}
              </span>
            </div>
          )}

          {/* Bookmark + Share — hover (featured + desktop) */}
          <div
            className={`absolute transition-opacity opacity-0 bottom-3 right-3 group-hover:opacity-100 items-center gap-1.5 ${featured ? "flex" : "hidden md:flex"}`}>
            <button
              onClick={handleShare}
              aria-label="Haberi paylaş"
              className="flex items-center justify-center transition-colors rounded-full w-7 h-7 bg-stone-950/70 backdrop-blur-sm hover:bg-stone-950/90">
              {copied ? (
                <svg
                  className="w-3 h-3 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              )}
            </button>
            <BookmarkButton
              article={article}
              className="rounded-full w-7 h-7 bg-stone-950/70 backdrop-blur-sm hover:bg-stone-950/90"
            />
          </div>
        </div>

        {/* İçerik */}
        <div className="flex flex-col justify-between flex-1 min-w-0 p-3 md:p-4">
          {/* Mobil: kaynak satırı — featured modda gizli (üstte badge var) */}
          <div
            className={`flex items-center gap-1.5 mb-1.5 ${featured ? "hidden" : "md:hidden"}`}>
            {article.source_icon && (
              <Image
                src={article.source_icon}
                width={12}
                height={12}
                className="rounded-full shrink-0"
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <span className="text-[10px] font-bold text-stone-400 truncate">
              {article.source_name}
            </span>
            {credCfg && (
              <span title={credCfg.label} className="shrink-0 text-[10px]">
                {credCfg.badge}
              </span>
            )}
            {scorePreview && (
              <span
                className={`ml-auto shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full border ${verdictCfg.color}`}>
                {isHot && "🔥"}
                {scorePreview.overallScore}
              </span>
            )}
            {isRead && !scorePreview && (
              <span className="ml-auto shrink-0 text-[9px] text-stone-400 dark:text-stone-600 flex items-center gap-0.5">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                okundu
              </span>
            )}
          </div>

          <h3
            className="text-sm font-bold leading-snug transition-colors
                       text-stone-900 dark:text-stone-100
                       line-clamp-2 md:line-clamp-2
                       group-hover:text-amber-600 dark:group-hover:text-amber-400 mb-1.5"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
            {article.title}
          </h3>

          {article.description && (
            <p
              className={`mb-3 overflow-hidden text-xs leading-relaxed text-stone-500 dark:text-stone-400 line-clamp-2 ${featured ? "block" : "hidden md:block"}`}>
              {article.description.length > 120
                ? article.description.slice(0, 120).trimEnd() + "…"
                : article.description}
            </p>
          )}

          {/* Footer satırı */}
          <div
            className="flex items-center justify-between mt-auto
                          text-[10px] text-stone-400 dark:text-stone-500
                          pt-2 md:pt-3 border-t border-stone-100 dark:border-stone-800">
            <span className="flex items-center gap-1">
              <svg
                className="w-3 h-3 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatDate(article.pubDate)}
              <span className="text-stone-300 dark:text-stone-600 mx-0.5">
                ·
              </span>
              {readingTime(article)}&nbsp;dk
            </span>
            {/* Mobil: kategori chip */}
            {article.category?.[0] && (
              <span
                className="md:hidden text-[9px] font-black uppercase tracking-widest
                               px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-sm">
                {categoryLabel(article.category[0])}
              </span>
            )}
            {/* Desktop: yazar */}
            {article.creator?.[0] && (
              <span className="hidden truncate md:block max-w-30">
                {article.creator[0]}
              </span>
            )}
            {/* Mobil: bookmark + share her zaman görünür — featured modda gizli (üstte hover var) */}
            <div
              className={`flex items-center gap-1.5 ${featured ? "hidden" : "md:hidden"}`}>
              <button
                onClick={handleShare}
                aria-label="Haberi paylaş"
                className="flex items-center justify-center transition-colors rounded-full w-7 h-7 bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-900/40">
                {copied ? (
                  <svg
                    className="w-3 h-3 text-emerald-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3 h-3 text-stone-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                )}
              </button>
              <BookmarkButton
                article={article}
                className="rounded-full w-7 h-7 bg-stone-100 dark:bg-stone-800"
              />
            </div>
          </div>
        </div>
      </Link>

      {/* Hover tooltip */}
      {hovered && scorePreview && (
        <div className="absolute z-30 w-56 p-3 mb-2 -translate-x-1/2 border shadow-2xl pointer-events-none bottom-full left-1/2 bg-stone-950 border-stone-700 rounded-xl">
          <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-2.5">
            Güvenilirlik Skoru
          </p>
          {Object.entries(scorePreview.scores || {}).map(([key, val]) => {
            const display = key === "emotionalLanguage" ? 100 - val : val;
            const color =
              display >= 70
                ? "bg-emerald-500"
                : display >= 40
                  ? "bg-amber-500"
                  : "bg-red-500";
            return (
              <div key={key} className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] text-stone-500 w-20 shrink-0">
                  {SCORE_LABELS[key]}
                </span>
                <div className="flex-1 h-1 rounded-full bg-stone-800">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className="text-[9px] font-black text-stone-300 w-5 text-right tabular-nums">
                  {val}
                </span>
              </div>
            );
          })}
          {/* Ok */}
          <div className="absolute w-0 h-0 -translate-x-1/2 border-t-4 border-l-4 border-r-4 top-full left-1/2 border-l-transparent border-r-transparent border-t-stone-950" />
        </div>
      )}
    </div>
  );
}
