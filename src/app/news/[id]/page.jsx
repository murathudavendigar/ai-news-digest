
import { getNewsByArticleID } from "@/app/lib/news";
import Link from "next/link";
import { notFound } from "next/navigation";
import AISummary from "@/app/components/AISummary";
import NewsComparison from "@/app/components/NewsComparison";
import ArticleAnalysis from "@/app/components/ArticleAnalysis";
import ReadingToolbar from "@/app/components/ReadingToolbar";

export default async function NewsDetailPage({ params }) {
  const { id } = await params;
  const data = await getNewsByArticleID(id);
  const article = data.results ? data.results[0] : null;
  if (!article) notFound();

  const articleContext = {
    articleId: article.article_id,
    title: article.title,
    description: article.description ?? undefined,
    sourceUrl: article.link,
    sourceName: article.source_name ?? undefined,
    publishedAt: article.pubDate ?? undefined,
    category: article.category ?? undefined,
    keywords: article.keywords ?? undefined,
    language: article.language ?? undefined,
  };

  return (
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
              <div className="mb-6 -mx-6 -mt-6 overflow-hidden rounded-xl md:-mx-8 md:-mt-8">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="object-cover w-full h-64 md:h-80"
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
                  <img
                    src={article.source_icon}
                    alt={article.source_name}
                    className="w-8 h-8 border rounded-full border-stone-200 dark:border-stone-700"
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
                  {cat}
                </span>
              ))}
              {article.country?.[0] && (
                <span className="px-3 py-1 text-xs font-bold uppercase rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                  📍 {article.country[0]}
                </span>
              )}
            </div>

            {/* Keywords */}
            {article.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {article.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 bg-stone-50 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 rounded-full text-xs border border-stone-200 dark:border-stone-700">
                    #{kw}
                  </span>
                ))}
              </div>
            )}

            {/* Açıklama */}
            {article.description && (
              <div className="pb-8 mb-8 border-b border-stone-100 dark:border-stone-800">
                <p
                  className="text-lg leading-relaxed text-stone-700 dark:text-stone-300"
                  style={{ fontFamily: "var(--font-body), Georgia, serif" }}>
                  {article.description}
                </p>
              </div>
            )}

            {/* AI Bölümleri */}
            <div className="space-y-6">
              <AISummary article={articleContext} />
              <ArticleAnalysis article={article} />
              <NewsComparison article={article} />
            </div>

            {/* Kaynak footer */}
            <div className="flex items-center justify-between pt-6 mt-8 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2 text-sm text-stone-400">
                {article.source_icon && (
                  <img
                    src={article.source_icon}
                    className="w-4 h-4 rounded-full"
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
  );
}
