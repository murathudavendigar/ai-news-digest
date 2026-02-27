import AISummary from "@/app/components/AISummary";
import ArticleAnalysis from "@/app/components/ArticleAnalysis";
import NewsComparison from "@/app/components/NewsComparison";
import ReadingProgress from "@/app/components/ReadingProgress";
import { getNewsByArticleID } from "@/app/lib/news";
import Link from "next/link";
import { notFound } from "next/navigation";

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container max-w-4xl px-4 py-8 mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-gray-600 dark:text-gray-400">
          <Link
            href="/"
            className="hover:text-primary-600 dark:hover:text-primary-400">
            Anasayfa
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Haber Detayı</span>
        </div>

        <ReadingProgress title={article.title} />

        <article className="overflow-hidden bg-white shadow-xl dark:bg-gray-800 rounded-2xl">
          <div className="p-8">
            {article.image_url && (
              <div className="mb-6 overflow-hidden rounded-xl">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="object-cover w-full h-auto"
                />
              </div>
            )}

            <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                {article.source_icon && (
                  <img
                    src={article.source_icon}
                    alt={article.source_name}
                    className="w-8 h-8 border rounded-full border-slate-100"
                  />
                )}
                <div>
                  <p className="text-sm font-bold leading-none text-slate-900 dark:text-white">
                    {article.source_name}
                  </p>
                  <p className="mt-1 text-xs tracking-wider uppercase text-slate-500">
                    {article.source_id}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">
                  {new Date(article.pubDate).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {article.category?.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1 text-xs font-bold text-blue-600 uppercase rounded-md bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400">
                  {cat}
                </span>
              ))}
              <span className="px-3 py-1 text-xs font-bold uppercase rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                📍 {article.country?.[0]}
              </span>
              <span className="px-3 py-1 text-xs font-bold uppercase rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                🌐 {article.language}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {article.keywords?.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">
                  #{keyword}
                </span>
              ))}
            </div>

            {article.description && (
              <div className="mb-8 prose dark:prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                  {article.description}
                </p>
              </div>
            )}

            {/* ── AI SUMMARY ── */}
            <div className="mb-8">
              <AISummary
                article={articleContext}
                // forceLanguage="tr"
                // fast={true}
              />
            </div>

            {/* ── DEEP ANALYSIS ── */}
            <div className="mb-4">
              <ArticleAnalysis article={article} />
            </div>

            {/* ── SOURCE COMPARISON ── */}
            <div className="mb-8">
              <NewsComparison article={article} />
            </div>

            {/* External Link — minimal */}
            <div className="flex items-center justify-between py-4 mt-8 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
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
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 transition-colors dark:text-gray-300 hover:text-gray-900 dark:hover:text-white group">
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
