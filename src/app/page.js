import { Suspense } from "react";
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

/* ── Skeleton placeholders ─────────────────────────────── */

function DigestSkeleton() {
  return (
    <div
      style={{
        height: "120px",
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-elevated)",
        animation: "pulse 2s infinite",
      }}
    />
  );
}

function FeedSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            height: i === 0 ? "240px" : "120px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-elevated)",
            animation: "pulse 2s infinite",
          }}
        />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const today = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="homepage-v2">
      <div className="homepage-v2-glow" aria-hidden="true" />

      {/* 1. Breaking news — full width, shows only when breaking exists */}
      <Suspense fallback={null}>
        <BreakingNewsBanner />
      </Suspense>

      <section className="homepage-v2-hero" aria-label="Gunun manseti">
        <div className="homepage-v2-hero-grid">
          <div className="homepage-v2-hero-copy">
            <p className="homepage-v2-kicker">AI News Digest • {today}</p>
            <h1 className="homepage-v2-title">
              Gunun hikayesini sadece okumayin, anlayin.
            </h1>
            <p className="homepage-v2-subtitle">
              Son dakika akisini, derin analizleri ve kose yazilarini tek bir
              ritimde sunan yeni nesil haber deneyimi.
            </p>
            <div className="homepage-v2-badges">
              <span>Canli Piyasa</span>
              <span>AI Ozet</span>
              <span>Dunya Gundemi</span>
            </div>
          </div>

          <div className="homepage-v2-hero-panel" aria-hidden="true">
            <div className="homepage-v2-scanline" />
            <p>Signal</p>
            <strong>08.4</strong>
            <small>Gunun haber yogunlugu</small>
          </div>
        </div>
      </section>

      {/* 2. Main content area */}
      <div className="home-layout">
        {/* LEFT / MAIN column */}
        <div className="home-main">
          {/* Daily digest card */}
          <section className="homepage-v2-section homepage-v2-section-digest">
            <Suspense fallback={<DigestSkeleton />}>
              <DailyDigestCard />
            </Suspense>
          </section>

          {/* Today's columnist teaser */}
          <section className="homepage-v2-section">
            <Suspense fallback={null}>
              <TodaysColumnistCard />
            </Suspense>
          </section>

          {/* Main news feed with category tabs */}
          <section className="homepage-v2-section">
            <Suspense fallback={<FeedSkeleton />}>
              <HomeNewsFeed />
            </Suspense>
          </section>

          {/* World news strip */}
          <section className="homepage-v2-section">
            <Suspense fallback={null}>
              <WorldNewsStrip />
            </Suspense>
          </section>
        </div>

        {/* RIGHT / SIDEBAR — desktop only */}
        <aside className="home-sidebar">
          <div className="homepage-v2-section homepage-v2-market">
            <Suspense fallback={null}>
              <MarketWidget />
            </Suspense>
          </div>
        </aside>
      </div>
    </main>
  );
}
