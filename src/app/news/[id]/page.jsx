import { getNewsByArticleID } from "@/app/lib/news";
import Link from "next/link";
import { notFound } from "next/navigation";
import AISummary from "@/app/components/AISummary";

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
                // forceLanguage="tr"  ← her zaman Türkçe için yorumu kaldır
                // fast={true}         ← hızlı/ucuz model için
              />
            </div>

            {/* External Link */}
            <div className="p-6 mt-12 text-center border rounded-2xl bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30">
              <h3 className="mb-2 font-bold text-amber-800 dark:text-amber-400">
                Haberin Devamı Mevcut Değil
              </h3>
              <p className="mb-6 text-sm text-amber-700 dark:text-amber-500">
                Ücretsiz plan kapsamında haberin sadece özeti sunulmaktadır.
              </p>
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 px-10 rounded-xl hover:scale-[1.02] transition-transform active:scale-95">
                Haberin Tamamını Oku
              </a>
              <p className="mt-4 text-[10px] text-slate-400 break-all">
                Kaynak: {article.link}
              </p>
            </div>
          </div>
        </article>

        <div className="p-4 mt-8 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            💡 <strong>Not: </strong> NewsDATA ücretsiz planı tam haber içeriği
            sunmaz.
          </p>
        </div>
      </div>
    </div>
  );
}
