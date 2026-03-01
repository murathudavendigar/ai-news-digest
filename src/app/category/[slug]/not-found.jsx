
import Link from "next/link";

const ALL_CATEGORIES = [
  { slug: "technology", title: "Teknoloji", icon: "💻" },
  { slug: "sports", title: "Spor", icon: "⚽" },
  { slug: "business", title: "Ekonomi", icon: "📈" },
  { slug: "health", title: "Sağlık", icon: "🏥" },
  { slug: "entertainment", title: "Magazin", icon: "🎬" },
  { slug: "politics", title: "Politika", icon: "🏛️" },
  { slug: "world", title: "Dünya", icon: "🌍" },
];

export default function CategoryNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <p className="mb-3 text-6xl">🗂️</p>
        <div className="h-0.5 w-16 bg-amber-400 mx-auto mb-5" />
        <h1
          className="mb-2 text-2xl font-black text-stone-900 dark:text-stone-100"
          style={{ fontFamily: "Georgia, serif" }}>
          Kategori Bulunamadı
        </h1>
        <p className="mb-8 text-sm text-stone-500 dark:text-stone-400">
          Aradığınız kategori mevcut değil. Aşağıdaki kategorilere göz
          atabilirsiniz.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-8 sm:grid-cols-3">
          {ALL_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl
                         bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700
                         hover:border-stone-400 dark:hover:border-stone-500
                         text-sm font-semibold text-stone-700 dark:text-stone-300
                         transition-all group">
              <span>{cat.icon}</span>
              <span>{cat.title}</span>
              <span className="ml-auto transition-colors text-stone-300 dark:text-stone-600 group-hover:text-stone-500">
                ›
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/"
          className="text-sm font-semibold transition-colors text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">
          ← Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
