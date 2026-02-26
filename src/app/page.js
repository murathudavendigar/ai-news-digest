import NewsCard from "@/app/components/NewsCard";
import { getLatest } from "@/app/lib/news";

export default async function HomePage() {
  const newsData = await getLatest("tr");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🔥 Son Dakika Haberleri
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Türkiye&apos;den ve dünyadan en güncel haberler
          </p>
        </div>

        {/* Stats */}
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-8">
          <p className="text-sm text-primary-700 dark:text-primary-300">
            📊 Toplam <strong>{newsData.totalResults}</strong> haber bulundu.
            Veriler her 5 dakikada bir güncelleniyor.
          </p>
        </div>

        {/* Haber Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
