import AISummary from "@/app/components/AISummary";
import ArticleAnalysis from "@/app/components/ArticleAnalysis";
import BookmarkButton from "@/app/components/BookmarkButton";
import NewsComparison from "@/app/components/NewsComparison";
import ReadingToolbar from "@/app/components/ReadingToolbar";
import RelatedArticles from "@/app/components/RelatedArticles";
import ShareButton from "@/app/components/ShareButton";
import { CATEGORY_LABELS } from "@/app/lib/categoryConfig";
import { getArticleForDetail } from "@/app/lib/newsSource";
import { siteConfig } from "@/app/lib/siteConfig";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// Okuma geçmişi tracker — client component (localStorage'a yazar)
import ReadHistoryTracker from "@/app/components/ReadHistoryTracker";

const SITE_URL = siteConfig.url;

// Slug formatı: "haber-basligi--articleId"
// ID her zaman son "--" sonrasında gelir
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
  if (!article) notFound();

  // RSS makalelerinde keywords alanı yoktur; başlıktan türetiriz
  const derivedKeywords =
    article.keywords ??
    article.title
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 6);

  const articleContext = {
    articleId: article.article_id,
    title: article.title,
    description: article.description ?? undefined,
    content: article.content ?? undefined, // RSS tam metin
    sourceUrl: article.link,
    sourceName: article.source_name ?? undefined,
    publishedAt: article.pubDate ?? undefined,
    category: article.category ?? undefined,
    keywords: derivedKeywords,
    language: article.language ?? "tr",
    fromRSS: article._fromRSS ?? false,
  };

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
      "@id": `${SITE_URL}/news/${slug}`,
    },
  };

  // Mevcut sayfanin tam URL'si (paylas icin)
  const articleUrl = `${SITE_URL}/news/${slug}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen">
        <ReadingToolbar title={article.title} articleUrl={article.link} />

        <div className="max-w-4xl px-4 py-8 mx-auto sm:px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-sm text-stone-500 dark:text-stone-400">
            <Link
              href="/"
              className="transition-colors hover:text-stone-900 dark:hover:text-stone-100">
              Anasayfa
            </Link>
            <span>›</span>
            <span className="max-w-xs truncate text-stone-700 dark:text-stone-300">
              {article.title?.slice(0, 60)}…
            </span>
          </div>

          <article
            id="article-content"
            className="overflow-hidden bg-white shadow-xl dark:bg-stone-900 rounded-2xl">
            <div className="p-6 md:p-8">
              {/* Görsel */}
              {article.image_url && (
                <div className="relative mb-6 -mx-6 -mt-6 overflow-hidden rounded-xl md:-mx-8 md:-mt-8 h-64 md:h-80">
                  <Image
                    src={article.image_url}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 896px) 100vw, 896px"
                    priority
                  />
                </div>
              )}

              {/* Başlık */}
              <h1
                className="mb-4 text-3xl font-black leading-tight md:text-4xl text-stone-900 dark:text-white"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
                {article.title}
              </h1>

              {/* Meta: kaynak + tarih */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-3">
                  {article.source_icon && (
                    <Image
                      src={article.source_icon}
                      alt={article.source_name ?? ""}
                      width={32}
                      height={32}
                      className="border rounded-full border-stone-200 dark:border-stone-700"
                    />
                  )}
                  <div>
                    <p className="text-sm font-bold leading-none text-stone-900 dark:text-white">
                      {article.source_name}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5 uppercase tracking-wider">
                      {article.source_id}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-stone-400">
                  {new Date(article.pubDate).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Kategori + ülke badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {article.category?.map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                    {CATEGORY_LABELS[cat?.toLowerCase()] ?? cat}
                  </span>
                ))}
                {article.country?.[0] && (
                  <span className="px-3 py-1 text-xs font-bold uppercase rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                    📍 {article.country[0]}
                  </span>
                )}
              </div>

              {/* ── Aksiyon çubuğu: Paylas + Kaydet ── */}
              <div className="flex items-center gap-3 mb-6">
                <ShareButton title={article.title} url={articleUrl} />
                <BookmarkButton
                  article={{
                    article_id: article.article_id,
                    title: article.title,
                    description: article.description,
                    image_url: article.image_url,
                    source_name: article.source_name,
                    pubDate: article.pubDate,
                    link: article.link,
                    category: article.category,
                  }}
                  showLabel
                  size="lg"
                />
              </div>

              {/* Keywords — NewsData'dan gelir veya başlıktan türetilir */}
              {derivedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {derivedKeywords.slice(0, 8).map((kw, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 bg-stone-50 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 rounded-full text-xs border border-stone-200 dark:border-stone-700">
                      #{kw}
                    </span>
                  ))}
                </div>
              )}

              {/* ─── Makale Metni ─────────────────────────────────────────
                   RSS makalelerinde `content` = tam metin (HTML soy.)
                   NewsData makalelerinde `description` = özet/giriş
              ─────────────────────────────────────────────────────────── */}
              {(article.content || article.description) && (
                <div className="pb-8 mb-8 border-b border-stone-100 dark:border-stone-800">
                  {/* RSS tam metin rozeti */}
                  {article._hasFullContent && (
                    <div className="flex items-center gap-1.5 mb-4">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                                   bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400
                                   border border-emerald-200 dark:border-emerald-800">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                          />
                        </svg>
                        RSS — tam metin
                      </span>
                    </div>
                  )}
                  <p
                    className="text-base leading-relaxed whitespace-pre-line text-stone-700 dark:text-stone-300"
                    style={{ fontFamily: "var(--font-body), Georgia, serif" }}>
                    {article.content || article.description}
                  </p>
                </div>
              )}

              {/* AI Bölümleri */}
              <div className="space-y-6">
                <ReadHistoryTracker categories={article.category} />
                <AISummary article={articleContext} />
                <ArticleAnalysis article={article} />
                <NewsComparison article={article} />
              </div>

              {/* Bu konudaki haberler */}
              <RelatedArticles
                keywords={derivedKeywords}
                currentId={article.article_id}
                title={article.title}
              />

              {/* Kaynak footer */}
              <div className="flex items-center justify-between pt-6 mt-8 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2 text-sm text-stone-400">
                  {article.source_icon && (
                    <Image
                      src={article.source_icon}
                      width={16}
                      height={16}
                      className="rounded-full"
                      alt=""
                    />
                  )}
                  <span>{article.source_name}</span>
                </div>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-semibold transition-colors text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white group">
                  Kaynağa git
                  <svg
                    className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
