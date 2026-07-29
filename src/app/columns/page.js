import { Suspense } from "react";
import { supabase } from "@/app/lib/supabase";
import {
  getTodaysColumnistSlug,
  getColumnistAccent,
  getSevenDaysAgoISO,
} from "@/app/lib/columnistConfig";
import Link from "next/link";
import FollowColumnistButton from "@/app/components/FollowColumnistButton";
import { siteConfig } from "@/app/lib/siteConfig";

export const metadata = {
  title: "Köşe Yazıları | HaberAI",
  description:
    "7 bağımsız AI yazarından her gün yeni bir köşe yazısı. Politikadan spora, teknolojiden kültüre.",
  alternates: { canonical: `${siteConfig.url}/columns` },
  openGraph: {
    title: "Köşe Yazıları — HaberAI",
    description:
      "7 bağımsız AI yazarından her gün yeni bir köşe yazısı.",
    url: `${siteConfig.url}/columns`,
  },
};

const DAYS_TR = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];

const getInitials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

function SectionLabel({ children }) {
  return (
    <div className="page-section-label">
      <span>{children}</span>
      <span className="page-section-rule" aria-hidden="true" />
    </div>
  );
}

function TodaysColumnSkeleton() {
  return (
    <div className="mb-14">
      <SectionLabel>Bugün</SectionLabel>
      <div className="h-64 animate-pulse border border-[var(--border-subtle)] bg-[var(--bg-elevated)]" />
    </div>
  );
}

function ThisWeekSkeleton() {
  return (
    <div className="mb-14">
      <SectionLabel>Bu hafta</SectionLabel>
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-56 w-70 shrink-0 animate-pulse border border-[var(--border-subtle)] bg-[var(--bg-elevated)] sm:w-[320px]"
          />
        ))}
      </div>
    </div>
  );
}

function TopColumnsSkeleton() {
  return (
    <div className="mb-14">
      <SectionLabel>Haftanın en çok okunanları</SectionLabel>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
          />
        ))}
      </div>
    </div>
  );
}

function AllColumnistsSkeleton() {
  return (
    <div className="mb-12">
      <SectionLabel>Tüm yazarlar</SectionLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
          />
        ))}
      </div>
    </div>
  );
}

async function TodaysColumnSection({
  columnistsPromise,
  recentColumnsPromise,
  todaySlug,
}) {
  const [{ data: columnists }, { data: recentColumns }] = await Promise.all([
    columnistsPromise,
    recentColumnsPromise,
  ]);
  const todayColumnist = columnists?.find((c) => c.slug === todaySlug);
  const todayColumn = recentColumns?.find(
    (c) => c.columnist_id === todayColumnist?.id,
  );

  if (!todayColumnist || !todayColumn) {
    return (
      <section className="mb-14">
        <SectionLabel>Bugün</SectionLabel>
        <div className="page-empty">
          <h3>Bugünün yazısı henüz hazır değil</h3>
          <p>Yazarlar sırayla yayınlanır. Bu haftanın yazılarına göz at.</p>
          <a href="#bu-hafta" className="article-text-link accent">
            Bu haftaya in →
          </a>
        </div>
      </section>
    );
  }

  const accent = getColumnistAccent(todaySlug);

  return (
    <section className="mb-14">
      <SectionLabel>Bugün</SectionLabel>

      <div className="group relative overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div
          className="absolute left-0 right-0 top-0 h-1.5 opacity-90"
          style={{ backgroundColor: accent.primary }}
        />

        <div className="relative z-10 flex flex-col items-start gap-8 p-7 md:flex-row md:p-10">
          <div className="flex shrink-0 flex-col items-center gap-3">
            <Link href={`/columns/${todayColumnist.slug}`}>
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white transition-transform hover:scale-105 md:h-24 md:w-24 md:text-3xl"
                style={{ backgroundColor: accent.primary }}
              >
                {getInitials(todayColumnist.name)}
              </div>
            </Link>
            <div className="text-center">
              <Link
                href={`/columns/${todayColumnist.slug}`}
                className="block text-base font-bold text-[var(--text-primary)] no-underline hover:underline"
              >
                {todayColumnist.name}
              </Link>
              <p className="mx-auto mt-1 max-w-30 text-xs leading-tight text-[var(--text-muted)]">
                {todayColumnist.title}
              </p>
            </div>
          </div>

          <div className="flex h-full flex-1 flex-col">
            <Link
              href={`/columns/${todayColumnist.slug}/${todayColumn.slug}`}
              className="flex-1 no-underline"
            >
              <h3
                className="mb-4 text-3xl font-bold leading-tight text-[var(--text-primary)] transition-opacity group-hover:opacity-80 md:text-4xl"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}
              >
                {todayColumn.title}
              </h3>
              <p className="mb-6 line-clamp-3 text-base leading-relaxed text-[var(--text-secondary)] md:line-clamp-2">
                {todayColumn.content
                  ?.split("\n")
                  .find((l) => l.trim() && !l.startsWith("#"))
                  ?.trim()}
              </p>
            </Link>

            <div className="mt-auto flex w-full flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-5">
              <div className="flex items-center gap-3 text-sm font-medium text-[var(--text-muted)]">
                <span>{todayColumn.read_time_minutes} dk okuma</span>
                {todayColumn.view_count > 0 && (
                  <>
                    <span>·</span>
                    <span>
                      {todayColumn.view_count.toLocaleString("tr-TR")} okuyucu
                    </span>
                  </>
                )}
              </div>
              <Link
                href={`/columns/${todayColumnist.slug}/${todayColumn.slug}`}
                className="inline-flex items-center justify-center border border-[var(--text-primary)] bg-[var(--text-primary)] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--bg-primary)] no-underline transition-opacity hover:opacity-90"
              >
                Oku →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

async function ThisWeekColumnsSection({
  recentColumnsPromise,
  columnistsPromise,
  todaySlug,
}) {
  const [{ data: recentColumns }, { data: columnists }] = await Promise.all([
    recentColumnsPromise,
    columnistsPromise,
  ]);
  const todayColumnist = columnists?.find((c) => c.slug === todaySlug);
  const todayColumn = recentColumns?.find(
    (c) => c.columnist_id === todayColumnist?.id,
  );

  const thisWeekColumns = [];
  const seenColumnists = new Set();

  if (recentColumns) {
    for (const col of recentColumns) {
      if (!seenColumnists.has(col.columnist_id) && col.id !== todayColumn?.id) {
        seenColumnists.add(col.columnist_id);
        thisWeekColumns.push(col);
      }
    }
  }

  if (thisWeekColumns.length === 0) return null;

  return (
    <section id="bu-hafta" className="mb-14 scroll-mt-8">
      <SectionLabel>Bu hafta</SectionLabel>

      <div className="scrollbar-hide -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4">
        {thisWeekColumns.map((col) => {
          const accent = getColumnistAccent(col.columnist.slug);
          return (
            <Link
              key={col.id}
              href={`/columns/${col.columnist.slug}/${col.slug}`}
              className="group relative flex w-70 shrink-0 snap-start flex-col overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 no-underline transition-colors hover:border-[var(--border-strong)] sm:w-[320px]"
              style={{ borderTopWidth: 3, borderTopColor: accent.primary }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white"
                  style={{ backgroundColor: accent.primary }}
                >
                  {getInitials(col.columnist.name)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-tight text-[var(--text-primary)]">
                    {col.columnist.name}
                  </span>
                  <time className="text-xs text-[var(--text-muted)]">
                    {new Date(col.published_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                    })}
                  </time>
                </div>
              </div>
              <h3 className="mb-3 text-lg font-bold leading-snug text-[var(--text-primary)] transition-opacity group-hover:opacity-80">
                {col.title}
              </h3>
              <p className="mt-auto line-clamp-3 text-sm text-[var(--text-muted)]">
                {col.content
                  ?.split("\n")
                  .find((l) => l.trim() && !l.startsWith("#"))
                  ?.trim()}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

async function TopColumnsSection({ topColumnsPromise }) {
  const { data: topColumns } = await topColumnsPromise;
  if (!topColumns || topColumns.length === 0) return null;

  return (
    <section className="mb-14">
      <SectionLabel>Haftanın en çok okunanları</SectionLabel>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {topColumns.map((col, idx) => (
          <Link
            key={col.id}
            href={`/columns/${col.columnist.slug}/${col.slug}`}
            className="group flex items-start gap-4 border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 no-underline transition-colors hover:border-[var(--border-strong)]"
          >
            <div className="mt-0.5 font-serif text-3xl font-black leading-none text-[var(--border-strong)] transition-colors group-hover:text-[var(--text-muted)]">
              0{idx + 1}
            </div>
            <div>
              <h4 className="mb-1 font-bold leading-snug text-[var(--text-primary)] group-hover:underline decoration-[var(--border-subtle)]">
                {col.title}
              </h4>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <span
                  className="font-medium"
                  style={{
                    color: getColumnistAccent(col.columnist.slug).primary,
                  }}
                >
                  {col.columnist.name}
                </span>
                <span>·</span>
                <span>{col.view_count?.toLocaleString("tr-TR")} okuma</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function AllColumnistsSection({ columnistsPromise }) {
  const { data: columnists } = await columnistsPromise;
  if (!columnists?.length) {
    return (
      <section id="tum-yazarlar" className="mb-12 scroll-mt-8">
        <SectionLabel>Tüm yazarlar</SectionLabel>
        <div className="page-empty">
          <h3>Yazar listesi yüklenemedi</h3>
          <p>Biraz sonra tekrar dene.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="tum-yazarlar" className="mb-12 scroll-mt-8">
      <SectionLabel>Tüm yazarlar</SectionLabel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {columnists.map((col) => {
          const accent = getColumnistAccent(col.slug);
          return (
            <div
              key={col.id}
              className="flex flex-col border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
            >
              <Link
                href={`/columns/${col.slug}`}
                className="group mb-5 flex items-center gap-4 no-underline"
              >
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-black text-white transition-transform group-hover:scale-105"
                  style={{ backgroundColor: accent.primary }}
                >
                  {getInitials(col.name)}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[var(--text-primary)] transition-opacity group-hover:opacity-80">
                    {col.name}
                  </h4>
                  <p className="text-sm text-[var(--text-muted)]">{col.title}</p>
                </div>
              </Link>

              <div className="mt-auto flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  {DAYS_TR[col.publish_day]}
                </span>
                <FollowColumnistButton
                  columnistSlug={col.slug}
                  columnistName={col.name}
                  accentColor={accent.primary}
                  compact
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function ColumnsIndexPage() {
  const todaySlug = getTodaysColumnistSlug();
  const sevenDaysAgo = getSevenDaysAgoISO();

  const columnistsPromise = supabase
    .from("columnists")
    .select("*")
    .eq("is_active", true)
    .order("publish_day", { ascending: true });

  const recentColumnsPromise = supabase
    .from("columns")
    .select("*, columnist:columnist_id(name, slug, title, avatar_url)")
    .order("published_at", { ascending: false })
    .limit(20);

  const topColumnsPromise = supabase
    .from("columns")
    .select("*, columnist:columnist_id(name, slug, title, avatar_url)")
    .gte("published_at", sevenDaysAgo)
    .order("view_count", { ascending: false })
    .limit(3);

  return (
    <main className="page-shell">
      <div className="page-container max-w-5xl">
        <nav className="page-crumb" aria-label="Sayfa yolu">
          <Link href="/">Ana sayfa</Link>
          <span aria-hidden="true">/</span>
          <Link href="/digest">Özet</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--text-secondary)]">Köşe yazıları</span>
        </nav>

        <header className="page-masthead mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="page-masthead-kicker">Editoryal</p>
            <h1 className="page-masthead-title">Köşe Yazıları</h1>
            <p className="page-masthead-lede">
              Her gün yeni bir yazar, yeni bir bakış açısı.
            </p>
          </div>
          <a
            href="#tum-yazarlar"
            className="article-text-link inline-flex items-center gap-1"
          >
            Tüm yazarlar ↓
          </a>
        </header>

        <Suspense fallback={<TodaysColumnSkeleton />}>
          <TodaysColumnSection
            columnistsPromise={columnistsPromise}
            recentColumnsPromise={recentColumnsPromise}
            todaySlug={todaySlug}
          />
        </Suspense>

        <Suspense fallback={<ThisWeekSkeleton />}>
          <ThisWeekColumnsSection
            columnistsPromise={columnistsPromise}
            recentColumnsPromise={recentColumnsPromise}
            todaySlug={todaySlug}
          />
        </Suspense>

        <Suspense fallback={<TopColumnsSkeleton />}>
          <TopColumnsSection topColumnsPromise={topColumnsPromise} />
        </Suspense>

        <Suspense fallback={<AllColumnistsSkeleton />}>
          <AllColumnistsSection columnistsPromise={columnistsPromise} />
        </Suspense>
      </div>
    </main>
  );
}
