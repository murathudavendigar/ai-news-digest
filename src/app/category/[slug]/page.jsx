import CategoryEmptyActions from "@/app/components/CategoryEmptyActions";
import CategorySwipe from "@/app/components/CategorySwipe";
import NewsFeed from "@/app/components/NewsFeed";
import { getNewsFeed } from "@/app/lib/newsSource";
import { siteConfig } from "@/app/lib/siteConfig";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 300;

const CATEGORIES = {
  technology: {
    title: "Teknoloji",
    desc: "Yapay zeka, yazılım, donanım ve dijital dönüşüm",
  },
  science: {
    title: "Bilim",
    desc: "Fen, uzay, biyoloji, fizik ve bilimsel keşifler",
  },
  sports: {
    title: "Spor",
    desc: "Futbol, basketbol ve tüm spor dallarından haberler",
  },
  business: {
    title: "Ekonomi",
    desc: "Piyasalar, şirketler, makroekonomik gelişmeler",
  },
  health: {
    title: "Sağlık",
    desc: "Tıp, halk sağlığı, araştırmalar ve ilaç haberleri",
  },
  entertainment: {
    title: "Magazin",
    desc: "Sinema, müzik, sanat ve kültür dünyası",
  },
  culture: {
    title: "Kültür & Sanat",
    desc: "Edebiyat, güzel sanatlar, mimari ve kültürel haberler",
  },
  defense: {
    title: "Savunma",
    desc: "Savunma sanayi, askeri teknoloji ve güvenlik haberleri",
  },
  lifestyle: {
    title: "Yaşam",
    desc: "Sağlıklı yaşam, gastronomi, moda ve gezi haberleri",
  },
  politics: {
    title: "Politika",
    desc: "İç siyaset, meclis gündemi, seçim ve parti haberleri",
  },
  world: {
    title: "Dünya",
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
    alternates: { canonical: `${siteConfig.url}/category/${slug}` },
    openGraph: {
      title: `${cat.title} Haberleri — ${siteConfig.name}`,
      description: cat.desc,
      url: `${siteConfig.url}/category/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((slug) => ({ slug }));
}

const CATEGORY_KEYS = Object.keys(CATEGORIES);

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const cat = CATEGORIES[slug];
  if (!cat) notFound();

  const newsData = await getNewsFeed({ category: slug });
  const count = newsData.totalCount || newsData.results?.length || 0;

  return (
    <CategorySwipe currentSlug={slug} categoryKeys={CATEGORY_KEYS}>
      <div className="page-shell">
        <div className="page-container">
          <nav className="page-crumb" aria-label="Sayfa yolu">
            <Link href="/">Ana sayfa</Link>
            <span aria-hidden="true">/</span>
            <Link href="/digest">Özet</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[var(--text-secondary)]">{cat.title}</span>
          </nav>

          <header className="page-masthead">
            <p className="page-masthead-kicker">Kategori</p>
            <h1 className="page-masthead-title">{cat.title}</h1>
            <p className="page-masthead-lede">{cat.desc}</p>
            {count > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="page-chip">
                  <span className="page-chip-dot" aria-hidden="true" />
                  {count} haber
                </span>
                <span className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
                  Canlı güncelleniyor
                </span>
              </div>
            )}
          </header>

          {newsData.results?.length === 0 ? (
            <CategoryEmptyActions
              categoryTitle={cat.title}
              categorySlug={slug}
            />
          ) : (
            <NewsFeed
              key={slug}
              initialArticles={newsData.results}
              initialNextPage={newsData.nextPage || null}
              category={slug}
              showTabs={false}
            />
          )}
        </div>
      </div>
    </CategorySwipe>
  );
}
