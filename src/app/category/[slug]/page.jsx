import DailySummary from "@/app/components/DailySummary";
import NewsFeed from "@/app/components/NewsFeed";
import { getNewsByCategory } from "@/app/lib/news";
import Link from "next/link";
import { notFound } from "next/navigation";

// Kategori metadata
const CATEGORIES = {
  technology: { title: "Teknoloji", icon: "💻", category: "technology" },
  sports: { title: "Spor", icon: "⚽", category: "sports" },
  business: { title: "Ekonomi", icon: "💼", category: "business" },
  health: { title: "Sağlık", icon: "🏥", category: "health" },
  entertainment: { title: "Magazin", icon: "🎬", category: "entertainment" },
};

export default async function CategoryPage({ params }) {
  const { slug } = await params;

  const categoryData = CATEGORIES[slug];

  if (!categoryData) {
    notFound();
  }

  const newsData = await getNewsByCategory(categoryData.category, "tr");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 py-8 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-5xl">{categoryData.icon}</span>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {categoryData.title}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {categoryData.title} kategorisindeki en güncel haberler
          </p>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
          <Link
            href="/"
            className="hover:text-primary-600 dark:hover:text-primary-400">
            Anasayfa
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {categoryData.title}
          </span>
        </div>

        {/* Stats */}
        <div className="p-4 mb-8 border rounded-lg bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <p className="text-sm text-primary-700 dark:text-primary-300">
            📊 <strong>{newsData.totalResults}</strong>{" "}
            {categoryData.title.toLowerCase()} haberi bulundu
          </p>
        </div>

        {newsData.results?.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-4 text-6xl">📭</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
              Henüz haber bulunmuyor
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Lütfen daha sonra tekrar kontrol edin.
            </p>
          </div>
        ) : (
          <>
            <DailySummary />
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

// Static Params (Build time'da kategorileri oluştur)
export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((slug) => ({
    slug,
  }));
}
