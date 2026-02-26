import NewsCard from "@/app/components/NewsCard";
import { getLatest } from "@/app/lib/news";

export default async function HomePage() {
  const newsData = await getLatest("tr");

  console.log(newsData);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 py-8 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
            🔥 Son Dakika Haberleri
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Türkiye&apos;den ve dünyadan en güncel haberler
          </p>
        </div>

        {/* Stats */}
        <div className="p-4 mb-8 border rounded-lg bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <p className="text-sm text-primary-700 dark:text-primary-300">
            📊 Toplam <strong>{newsData.totalResults}</strong> haber bulundu.
            Veriler her 5 dakikada bir güncelleniyor.
          </p>
        </div>

        {/* Haber Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {newsData.results.map((article, index) => (
            <NewsCard
              key={index}
              article={article}
              priority={index < 3} // İlk 3 haber için priority loading
            />
          ))}
        </div>

        {/* No Results */}
        {newsData.results.length === 0 && (
          <div className="py-20 text-center">
            <div className="mb-4 text-6xl">📭</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
              Henüz haber bulunmuyor
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Lütfen daha sonra tekrar kontrol edin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
