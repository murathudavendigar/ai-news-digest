import NewsCard from "@/app/components/NewsCard";
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
      <div className="container mx-auto px-4 py-8">
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
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link
            href="/"
            className="hover:text-primary-600 dark:hover:text-primary-400">
            Anasayfa
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-semibold">
            {categoryData.title}
          </span>
        </div>

        {/* Stats */}
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-8">
          <p className="text-sm text-primary-700 dark:text-primary-300">
            📊 <strong>{newsData.totalResults}</strong>{" "}
            {categoryData.title.toLowerCase()} haberi bulundu
          </p>
        </div>

        {/* Haber Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsData.results.map((article) => (
            <NewsCard key={article.article_id} article={article} />
          ))}
        </div>

        {/* No Results */}
        {newsData.results.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Bu kategoride haber bulunamadı
            </h3>
          </div>
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
