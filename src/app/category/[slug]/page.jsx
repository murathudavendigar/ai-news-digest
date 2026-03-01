import NewsFeed from "@/app/components/NewsFeed";
import { getNewsByCategory } from "@/app/lib/news";
import { siteConfig } from "@/app/lib/siteConfig";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 300; // 5 dakikada bir ISR revalidate — ana sayfa ile aynı

const CATEGORIES = {
  technology: {
    title: "Teknoloji",
    icon: "💻",
    desc: "Yapay zeka, yazılım, donanım ve dijital dönüşüm",
  },
  sports: {
    title: "Spor",
    icon: "⚽",
    desc: "Futbol, basketbol ve tüm spor dallarından haberler",
  },
  business: {
    title: "Ekonomi",
    icon: "📈",
    desc: "Piyasalar, şirketler, makroekonomik gelişmeler",
  },
  health: {
    title: "Sağlık",
    icon: "🏥",
    desc: "Tıp, halk sağlığı, araştırmalar ve ilaç haberleri",
  },
  entertainment: {
    title: "Magazin",
    icon: "🎬",
    desc: "Sinema, müzik, sanat ve kültür dünyası",
  },
  politics: {
    title: "Politika",
    icon: "🏛️",
    desc: "İç siyaset, meclis gündemi, seçim ve parti haberleri",
  },
  world: {
    title: "Dünya",
    icon: "🌍",
    desc: "Uluslararası haberler, diplomasi ve küresel gelişmeler",
  },
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = CATEGORIES[slug];
  if (!cat) return {};
  return {
    title: `${cat.title} Haberleri — ${siteConfig.name}`,
    description: cat.desc,
  };
}

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((slug) => ({ slug }));
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const cat = CATEGORIES[slug];
  if (!cat) notFound();

  const newsData = await getNewsByCategory(slug, "tr");

  return (
    <div className="min-h-screen">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-xs text-stone-500 dark:text-stone-400">
          <Link
            href="/"
            className="transition-colors hover:text-stone-900 dark:hover:text-stone-100">
            Anasayfa
          </Link>
          <span>›</span>
          <span className="font-medium text-stone-700 dark:text-stone-300">
            {cat.title}
          </span>
        </div>

        {/* Başlık */}
        <div className="pb-6 mb-8 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-5xl">{cat.icon}</span>
            <div>
              <h1
                className="text-3xl font-black leading-none md:text-4xl text-stone-900 dark:text-stone-50"
                style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
                {cat.title}
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5">
                {cat.desc}
              </p>
            </div>
          </div>

          {/* Haber sayısı */}
          {newsData.totalResults > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 dark:text-stone-400
                               bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {newsData.totalResults} haber
              </span>
              <span className="text-xs text-stone-400 dark:text-stone-500">
                · Canlı güncelleniyor
              </span>
            </div>
          )}
        </div>

        {/* İçerik */}
        {newsData.results?.length === 0 ? (
          <div className="py-24 text-center">
            <p className="mb-4 text-5xl">📭</p>
            <h3 className="mb-2 text-lg font-bold text-stone-700 dark:text-stone-300">
              Henüz haber yok
            </h3>
            <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
              {cat.title} kategorisinde yakında haberler yayınlanacak.
            </p>
            <Link
              href="/"
              className="text-sm font-semibold transition-colors text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100">
              ← Ana sayfaya dön
            </Link>
          </div>
        ) : (
          <NewsFeed
            initialArticles={newsData.results}
            initialNextPage={newsData.nextPage || null}
          />
        )}
      </div>
    </div>
  );
}
