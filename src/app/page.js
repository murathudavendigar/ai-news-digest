
import NewsFeed from "@/app/components/NewsFeed";
import DailySummary from "@/app/components/DailySummary";
import { getLatest } from "@/app/lib/news";
import { getDailySummary } from "@/app/lib/dailySummary";

export const revalidate = 300; // 5 dakikada revalidate

export default async function HomePage() {
  // Paralel fetch — ikisi aynı anda çalışır
  const [newsData, summaryData] = await Promise.all([
    getLatest("tr"),
    getDailySummary(), // sadece cache'e bakar, üretmez — hızlı
  ]);

  return (
    <div className="min-h-screen">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6">
        {newsData.results?.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-4 text-6xl">📭</div>
            <h3 className="mb-2 text-xl font-semibold text-stone-700 dark:text-stone-300">
              Henüz haber bulunmuyor
            </h3>
            <p className="text-stone-500 dark:text-stone-400">
              Lütfen daha sonra tekrar kontrol edin.
            </p>
          </div>
        ) : (
          <>
            {/* summaryData null ise skeleton gösterilir */}
            <DailySummary data={summaryData} />
            <NewsFeed
              initialArticles={newsData.results}
              initialNextPage={newsData.nextPage || null}
            />
          </>
        )}
      </div>
    </div>
  );
}
