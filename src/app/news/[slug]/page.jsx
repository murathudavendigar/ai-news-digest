/* eslint-disable @next/next/no-img-element */
import CredibilityBadge from "@/app/components/CredibilityBadge";
import DeepAnalysis from "@/app/components/DeepAnalysis";
import DetailPageSummary from "@/app/components/DetailPageSummary";
import RelatedArticles from "@/app/components/RelatedArticles";
import ShareButton from "@/app/components/ShareButton";
import {
  CATEGORY_LABELS,
} from "@/app/lib/categoryConfig";
import { getArticleForDetail } from "@/app/lib/newsSource";
import { siteConfig } from "@/app/lib/siteConfig";

import Link from "next/link";

import ArticleReactions from "@/app/components/ArticleReactions";
import ReadingModeToggle from "@/app/components/ReadingModeToggle";
import SaveButton from "@/app/components/SaveButton";
import ArticleTracker from "@/app/components/ArticleTracker";

const SITE_URL = siteConfig.url;

function extractId(slug) {
  const idx = slug.lastIndexOf("--");
  return idx !== -1 ? slug.slice(idx + 2) : slug;
}

function estimateMinutes(article) {
  const text = [article.title, article.description, article.summary]
    .filter(Boolean)
    .join(" ");
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 200));
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
      <div className="article-detail flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <p className="article-kicker mb-4">Arşiv</p>
        <h1
          className="mb-3 text-3xl md:text-4xl font-black text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Bu haber baskıda yok
        </h1>
        <p className="mb-8 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
          Önbellekte bulunamadı veya bağlantı geçersiz. Ana sayfadan güncel
          manşetlere dönebilirsin.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className="article-text-link">
            Ana sayfa
          </Link>
          <Link href="/digest" className="article-text-link accent">
            Günün özeti
          </Link>
        </div>
      </div>
    );
  }

  const articleUrl = `${SITE_URL}/news/${slug}`;
  const sourceLink = article.link || article.url || null;
  const published = article.pubDate || article.publishedAt;
  const minutes = estimateMinutes(article);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.description ?? undefined,
    image: article.image_url ? [article.image_url] : undefined,
    datePublished: published,
    author: (article.creator ?? []).map((name) => ({
      "@type": "Person",
      name,
    })),
    publisher: {
      "@type": "Organization",
      name: article.source_name ?? siteConfig.name,
      url: article.source_url ?? undefined,
    },
    url: sourceLink || articleUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  };

  const categories = Array.isArray(article.category)
    ? article.category
    : article.category
      ? [article.category]
      : [];
  const categorySlug = Array.isArray(article.category)
    ? article.category[0]
    : article.category;

  const keywords = [
    ...(Array.isArray(article.keywords) ? article.keywords : []),
    ...categories.filter((c) => typeof c === "string"),
  ].slice(0, 6);

  return (
    <>
      <ArticleTracker article={article} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="article-detail">
        <header className="article-topbar">
          <Link href="/" className="article-text-link">
            ← Geri
          </Link>
          <span className="article-topbar-rule" aria-hidden="true" />
          <Link href="/digest" className="article-text-link accent">
            Günün özeti
          </Link>
          <div className="article-topbar-actions">
            <ReadingModeToggle />
            <SaveButton article={article} showLabel={false} />
            <ShareButton title={article.title} url={articleUrl} />
          </div>
        </header>

        <div className="article-shell">
          <article>
            <div className="article-meta-row">
              {categories.slice(0, 2).map((cat) => (
                <span key={cat} className="article-kicker">
                  {CATEGORY_LABELS[cat?.toLowerCase?.() ?? cat] ?? cat}
                </span>
              ))}
              <span className="article-meta-dot" aria-hidden="true">
                ·
              </span>
              <span className="article-meta-text">
                {article.source_name}
              </span>
              {published && (
                <>
                  <span className="article-meta-dot" aria-hidden="true">
                    ·
                  </span>
                  <time
                    className="article-meta-text"
                    dateTime={new Date(published).toISOString()}
                  >
                    {new Date(published).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </>
              )}
              <span className="article-meta-dot" aria-hidden="true">
                ·
              </span>
              <span className="article-meta-text">~{minutes} dk</span>
              <CredibilityBadge sourceName={article.source_name} />
            </div>

            <h1 className="article-headline">{article.title}</h1>

            {(article.description || article.summary) && (
              <p className="article-dek">
                {(article.description || article.summary).slice(0, 220)}
                {(article.description || article.summary).length > 220
                  ? "…"
                  : ""}
              </p>
            )}

            {article.image_url && (
              <figure className="article-figure">
                <img
                  src={article.image_url}
                  alt={article.title}
                  loading="eager"
                  decoding="async"
                />
                <figcaption>
                  {article.source_name
                    ? `${article.source_name} görseli`
                    : "Haber görseli"}
                </figcaption>
              </figure>
            )}

            {/* AI kısa okuma — RSS dek ile aynı metni tekrarlamaz */}
            <DetailPageSummary
              url={sourceLink}
              description={article.description || article.summary || ""}
            />

            <DeepAnalysis
              articleSlug={slug}
              articleTitle={article.title}
              articleUrl={sourceLink}
            />

            <RelatedArticles
              keywords={keywords}
              currentId={article.article_id}
              title={article.title}
            />

            <footer className="article-footer">
              <p className="mb-4 text-[11px] leading-relaxed text-[var(--text-muted)]">
                Haber metni özet/AI desteklidir; telif kaynak yayına aittir.
                {sourceLink ? (
                  <>
                    {" "}
                    <a
                      href={sourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[var(--accent-brand)] no-underline hover:underline"
                    >
                      Kaynağa git ↗
                    </a>
                  </>
                ) : null}
              </p>
              <div className="article-section-label">
                <span>Senin tepkin</span>
                <span className="article-section-rule" aria-hidden="true" />
              </div>
              <ArticleReactions
                articleSlug={slug}
                categorySlug={categorySlug}
                compact={false}
              />
              <div className="article-footer-actions">
                <SaveButton article={article} showLabel={true} />
                {sourceLink && (
                  <a
                    href={sourceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="article-text-link"
                  >
                    Kaynağa git ↗
                  </a>
                )}
                <Link href="/digest" className="article-text-link accent">
                  Günün özetine dön
                </Link>
              </div>
            </footer>
          </article>
        </div>
      </div>
    </>
  );
}
