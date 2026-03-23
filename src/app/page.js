import DailySummary from "@/app/components/DailySummary";
import NewsFeed from "@/app/components/NewsFeed";
import PullToRefresh from "@/app/components/PullToRefresh";
import { getDailySummary } from "@/app/lib/dailySummary";
import { getNewsFeed } from "@/app/lib/newsSource";
import { siteConfig } from "@/app/lib/siteConfig";
import ColumnistBanner from "@/app/components/ColumnistBanner";

export const revalidate = 300; // 5 dakikada revalidate

export const metadata = {
  title: "Son Dakika Haberler",
  description: siteConfig.descriptionHome,
  alternates: { canonical: siteConfig.url },
};

export default async function HomePage() {
  // Paralel fetch — ikisi aynı anda çalışır
  const [feedData, summaryData] = await Promise.all([
    getNewsFeed({ page: 1, pageSize: 30 }), // RSS + NewsData.io karışık
    getDailySummary(), // sadece cache'e bakar, üretmez — hızlı
  ]);

  return (
    <div className="min-h-screen">
      <PullToRefresh>
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6">
          {feedData.results?.length === 0 ? (
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
              <ColumnistBanner />
              <NewsFeed
                initialArticles={feedData.results}
                initialNextPage={feedData.nextPage || null}
              />
            </>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
