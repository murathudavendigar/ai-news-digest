import NewsCard from "@/app/components/NewsCard";
import { fetchInternationalNews } from "@/app/lib/fetchInternationalNews";
import Link from "next/link";

export default async function InternationalSection() {
  let articles = [];

  try {
    articles = await fetchInternationalNews();
  } catch (err) {
    console.error("[InternationalSection] Fetched failed", err);
  }

  if (articles.length === 0) return null;

  const topArticles = articles.slice(0, 6);

  return (
    <section className="mb-10 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-stone-900 dark:text-stone-100">
          <span>🌍</span> Dünya&apos;dan
        </h2>
        <Link
          href="/world"
          className="text-sm font-medium text-amber-600 dark:text-amber-500 hover:underline flex items-center gap-1">
          Tümünü gör
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

      <div className="flex md:grid md:grid-cols-2 gap-4 overflow-x-auto pb-4 scrollbar-none snap-x active:cursor-grabbing w-full">
        {topArticles.map((article, idx) => (
          <div
            key={`${article.article_id || idx}`}
            className="snap-start w-72 shrink-0 md:w-auto">
            {/* Using normal NewsCard instead of "featured" to keep it compact but 
                 you can adjust here depending on horizontal space constraint */}
            <NewsCard article={article} featured={false} priority={idx < 2} />
          </div>
        ))}
      </div>
    </section>
  );
}
