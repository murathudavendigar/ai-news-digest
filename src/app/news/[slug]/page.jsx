import CredibilityBadge from "@/app/components/CredibilityBadge";
import DetailPageSummary from "@/app/components/DetailPageSummary";
import ShareButton from "@/app/components/ShareButton";
import { CATEGORIES_WITHOUT_CONTEXT, CATEGORY_LABELS } from "@/app/lib/categoryConfig";
import { getArticleForDetail } from "@/app/lib/newsSource";
import { siteConfig } from "@/app/lib/siteConfig";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import ArticleReactions from "@/app/components/ArticleReactions";
import SaveButton from "@/app/components/SaveButton";
import ArticleTracker from "@/app/components/ArticleTracker";

const SITE_URL = siteConfig.url;

function extractId(slug) {
  const idx = slug.lastIndexOf("--");
  return idx !== -1 ? slug.slice(idx + 2) : slug;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const id = extractId(slug);
  const article = await getArticleForDetail(id);
  if (!article) return {};

  const title = article.title
    ? `${article.title.slice(0, 65)} — ${siteConfig.name}`
    : siteConfig.name;
  const description = article.description?.slice(0, 155) ?? "";
  const url = `${SITE_URL}/news/${slug}`;
  const image = article.image_url || `${SITE_URL}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: article.title }],
      type: "article",
      publishedTime: article.pubDate,
      authors: article.creator ?? [],
      siteName: siteConfig.name,
      locale: "tr_TR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function NewsDetailPage({ params }) {
  const { slug } = await params;
  const id = extractId(slug);
  const article = await getArticleForDetail(id);
  
  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="mb-6 text-6xl opacity-50">📰</div>
        <h1 className="mb-2 text-2xl font-bold text-stone-900 dark:text-white">Haber Bulunamadı</h1>
        <p className="mb-8 text-stone-500 dark:text-stone-400">
          Bu haber artık önbellekte bulunmuyor veya link geçersiz.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 font-bold text-white transition-colors bg-stone-900 dark:bg-white dark:text-stone-900 rounded-full hover:bg-stone-800 dark:hover:bg-stone-200">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  const articleUrl = `${SITE_URL}/news/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.description ?? undefined,
    image: article.image_url ? [article.image_url] : undefined,
    datePublished: article.pubDate,
    author: (article.creator ?? []).map((name) => ({
      "@type": "Person",
      name,
    })),
    publisher: {
      "@type": "Organization",
      name: article.source_name ?? siteConfig.name,
      url: article.source_url ?? undefined,
    },
    url: article.link,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  };

  // Determine if this category should show context blocks
  const categories = article.category || [];
  const showContextBlock = !categories.some((c) =>
    CATEGORIES_WITHOUT_CONTEXT.includes(c?.toLowerCase())
  );

  return (
    <>
      <ArticleTracker article={article} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen">
        <div className="max-w-3xl px-4 py-8 mx-auto sm:px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-sm text-stone-500 dark:text-stone-400">
            <Link
              href="/"
              className="transition-colors hover:text-stone-900 dark:hover:text-stone-100">
              ← Geri
            </Link>
            <span className="flex-1" />
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                {CATEGORY_LABELS[cat?.toLowerCase()] ?? cat}
              </span>
            ))}
            <SaveButton article={article} showLabel={false} />
            <ShareButton title={article.title} url={articleUrl} />
          </div>

          <article className="overflow-hidden bg-white shadow-xl dark:bg-stone-900 rounded-2xl">
            {/* Thumbnail */}
            {article.image_url && (
              <div className="relative w-full aspect-video overflow-hidden">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6 md:p-8">
              {/* Headline */}
              <h1
                className="mb-4 text-3xl font-black leading-tight md:text-4xl text-stone-900 dark:text-white"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
                {article.title}
              </h1>

              {/* Source + time + credibility */}
              <div className="flex flex-wrap items-center gap-3 pb-5 mb-6 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  {article.source_icon && (
                    <Image
                      src={article.source_icon}
                      alt={article.source_name ?? ""}
                      width={20}
                      height={20}
                      className="border rounded-full border-stone-200 dark:border-stone-700"
                    />
                  )}
                  <span className="text-sm font-bold text-stone-700 dark:text-stone-300">
                    {article.source_name}
                  </span>
                  <span className="text-stone-300 dark:text-stone-600">·</span>
                  <span className="text-sm text-stone-400">
                    {new Date(article.pubDate).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <CredibilityBadge sourceName={article.source_name} />
              </div>

              {/* AI Summary + Bullet Points (client component) */}
              <DetailPageSummary url={article.link} description={article.description} />

              {/* Context block — only for certain categories */}
              {showContextBlock && article.description && (
                <div className="mt-6 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                    Bağlam
                  </p>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    {article.description}
                  </p>
                </div>
              )}

              {/* Article Reactions & Save */}
              <div className="flex flex-col gap-4 mt-6 mb-4">
                <ArticleReactions articleSlug={slug} categorySlug={article.category?.[0]} compact={false} />
                <div className="flex items-center gap-3">
                  <SaveButton article={article} showLabel={true} />
                </div>
              </div>

              {/* Fallback to direct external link */}
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 px-6 mt-4
                           bg-stone-900 dark:bg-white text-white dark:text-stone-900
                           font-bold text-base rounded-xl
                           hover:bg-stone-800 dark:hover:bg-stone-100
                           transition-colors shadow-lg"
              >
                Kaynağa Git
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
