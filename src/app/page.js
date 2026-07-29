import { Suspense } from "react";
import Link from "next/link";
import { siteConfig } from "@/app/lib/siteConfig";
import BreakingNewsBanner from "@/app/components/BreakingNewsBanner";
import DailyDigestCard from "@/app/components/DailyDigestCard";
import TodaysColumnistCard from "@/app/components/TodaysColumnistCard";
import HomeNewsFeed from "@/app/components/HomeNewsFeed";
import WorldNewsStrip from "@/app/components/WorldNewsStrip";
import MarketWidget from "@/app/components/MarketWidget";

export const revalidate = 300;

export const metadata = {
  title: "Son Dakika Haberler",
  description: siteConfig.descriptionHome,
  alternates: { canonical: siteConfig.url },
};

function DigestSkeleton() {
  return (
    <div className="h-[140px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] animate-pulse" />
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] animate-pulse"
          style={{ height: i === 0 ? "220px" : "112px" }}
        />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="homepage-editorial">
      <Suspense fallback={null}>
        <BreakingNewsBanner />
      </Suspense>

      <header className="homepage-masthead">
        <div className="homepage-masthead-meta">
          <span>{today}</span>
          <span className="homepage-masthead-rule" aria-hidden="true" />
          <span>{siteConfig.subtitle}</span>
        </div>

        <h1 className="homepage-masthead-brand">
          {siteConfig.logoPrimary}
          <span className="homepage-masthead-accent">{siteConfig.logoAccent}</span>
        </h1>

        <p className="homepage-masthead-lede">
          Günün haberlerini oku, güvenilirliğini ölç, arka planı anla.
        </p>

        <div className="homepage-masthead-actions">
          <Link href="/digest" className="homepage-cta-primary">
            Günün özeti
          </Link>
          <Link href="/columns" className="homepage-cta-secondary">
            Köşe yazıları
          </Link>
        </div>
      </header>

      <div className="home-layout">
        <div className="home-main">
          <div className="homepage-feature-row">
            <section className="homepage-feature-cell homepage-feature-digest">
              <Suspense fallback={<DigestSkeleton />}>
                <DailyDigestCard />
              </Suspense>
            </section>

            <section className="homepage-feature-cell">
              <Suspense fallback={null}>
                <TodaysColumnistCard />
              </Suspense>
            </section>
          </div>

          <section className="homepage-feed-block">
            <div className="homepage-section-label">
              <span>Manşet & akış</span>
              <span className="homepage-section-rule" aria-hidden="true" />
            </div>
            <Suspense fallback={<FeedSkeleton />}>
              <HomeNewsFeed />
            </Suspense>
          </section>

          <section className="homepage-feed-block">
            <Suspense fallback={null}>
              <WorldNewsStrip />
            </Suspense>
          </section>
        </div>

        <aside className="home-sidebar">
          <div className="homepage-sidebar-panel sticky top-24">
            <p className="homepage-section-label mb-3">
              <span>Piyasalar</span>
            </p>
            <Suspense fallback={null}>
              <MarketWidget />
            </Suspense>
          </div>
        </aside>
      </div>
    </main>
  );
}
