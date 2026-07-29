import { supabase } from "@/app/lib/supabase";
import { projectInfo } from "@/app/lib/authorConfig";
import { notFound } from "next/navigation";
import Link from "next/link";
import ColumnReactions from "./ColumnReactions";
import { getColumnistAccent } from "@/app/lib/columnistConfig";
import ColumnistSignature from "@/app/components/ColumnistSignature";
import ArticleViewTracker from "@/app/components/ArticleViewTracker";
import TomorrowTeaser from "@/app/components/TomorrowTeaser";
import FollowColumnistButton from "@/app/components/FollowColumnistButton";
import QuoteShareButton from "@/app/components/QuoteShareButton";
import ColumnPoll from "@/app/components/ColumnPoll";
import ArticleShareButton from "@/app/components/ArticleShareButton";

export async function generateMetadata({ params }) {
  const { columnistSlug, columnSlug } = await params;
  const { data: column } = await supabase
    .from("columns")
    .select("title, subtitle, topic_summary, published_at")
    .eq("slug", columnSlug)
    .single();

  const { data: columnist } = await supabase
    .from("columnists")
    .select("name")
    .eq("slug", columnistSlug)
    .single();

  if (!column) return { title: "Yazı Bulunamadı" };

  const baseUrl = projectInfo.siteUrl;

  return {
    title: `${column.title} — ${columnist?.name || "HaberAI"} | HaberAI`,
    description: column.subtitle || column.topic_summary,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: column.title,
      description: column.subtitle || column.topic_summary,
      type: "article",
      publishedTime: column.published_at,
      authors: [columnist?.name].filter(Boolean),
      siteName: "HaberAI",
    },
    twitter: {
      card: "summary_large_image",
      title: column.title,
      description: column.subtitle || column.topic_summary,
      creator: "@haberai",
    },
  };
}

export default async function SingleColumnPage({ params }) {
  const { columnistSlug, columnSlug } = await params;

  const { data: columnist } = await supabase
    .from("columnists")
    .select("*")
    .eq("slug", columnistSlug)
    .single();

  if (!columnist) notFound();

  const { data: col } = await supabase
    .from("columns")
    .select("*")
    .eq("slug", columnSlug)
    .eq("columnist_id", columnist.id)
    .single();

  if (!col) notFound();

  const [{ data: pollData }, { data: otherColumns }] = await Promise.all([
    supabase.from("column_polls").select("id").eq("column_id", col.id).maybeSingle(),
    supabase
      .from("columns")
      .select("title, slug, published_at")
      .eq("columnist_id", columnist.id)
      .neq("id", col.id)
      .order("published_at", { ascending: false })
      .limit(3),
  ]);

  const initials = columnist.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const accent = getColumnistAccent(columnist.slug);

  const formatContent = (content) => {
    return content.split("\n\n").map((para, i) => {
      const trimmed = para.trim();
      if (!trimmed) return null;
      if (trimmed.startsWith("## ")) {
        return (
          <h2
            key={i}
            className="mb-4 mt-8 text-2xl font-bold text-[var(--text-primary)]"
          >
            {trimmed.replace("## ", "")}
          </h2>
        );
      }
      return (
        <p
          key={i}
          className="mb-6 text-lg leading-relaxed text-[var(--text-secondary)]"
        >
          {trimmed}
        </p>
      );
    });
  };

  const baseUrl = projectInfo.siteUrl;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: col.title,
    image: [`${baseUrl}/columns/${columnist.slug}/${col.slug}/opengraph-image`],
    datePublished: col.published_at,
    author: [
      {
        "@type": "Person",
        name: columnist.name,
        url: `${baseUrl}/columns/${columnist.slug}`,
      },
    ],
  };

  return (
    <main className="page-shell">
      <div className="page-container-narrow max-w-3xl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ArticleViewTracker
          columnistSlug={columnist.slug}
          columnSlug={col.slug}
        />

        <nav className="page-crumb" aria-label="Sayfa yolu">
          <Link href="/columns">Köşe yazıları</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/columns/${columnist.slug}`}>{columnist.name}</Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-[var(--text-secondary)]">Yazı</span>
        </nav>

        <article className="relative overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 md:p-10">
          <div
            className="absolute left-0 right-0 top-0 h-1.5 opacity-80"
            style={{ backgroundColor: accent.primary }}
          />

          <header className="relative mb-10 pb-10 text-center">
            <div className="mb-6 inline-flex flex-col items-center">
              <Link href={`/columns/${columnist.slug}`} className="group">
                <div
                  className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white transition-transform group-hover:scale-105"
                  style={{ backgroundColor: accent.primary }}
                >
                  {initials}
                </div>
                <div
                  className="font-bold transition-opacity group-hover:opacity-80"
                  style={{ color: accent.primary }}
                >
                  {columnist.name}
                </div>
              </Link>
              <div className="mt-2 flex flex-col items-center justify-center gap-3 text-sm text-[var(--text-muted)] sm:flex-row">
                <div className="flex items-center gap-2">
                  <span>
                    {new Date(col.published_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span>·</span>
                  <span>{col.read_time_minutes} dk okuma</span>
                  {col.view_count > 0 && (
                    <>
                      <span>·</span>
                      <span>
                        {col.view_count.toLocaleString("tr-TR")} okuma
                      </span>
                    </>
                  )}
                </div>
                <div className="hidden text-[var(--border-strong)] sm:block">
                  ·
                </div>
                <ArticleShareButton
                  url={`${baseUrl}/columns/${columnist.slug}/${col.slug}`}
                  title={col.title}
                  columnistName={columnist.name}
                />
              </div>
            </div>

            <h1
              className="mb-4 text-4xl font-black leading-tight text-[var(--text-primary)] md:text-5xl"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              {col.title}
            </h1>
            {col.subtitle && (
              <h2 className="text-xl font-medium text-[var(--text-secondary)] md:text-2xl">
                {col.subtitle}
              </h2>
            )}
          </header>

          <div
            className="prose-container"
            style={{ fontFamily: "var(--font-body), Georgia, serif" }}
          >
            {formatContent(col.content)}
          </div>

          {pollData?.id && (
            <ColumnPoll pollId={pollData.id} columnistAccent={accent.primary} />
          )}

          <div className="mb-8 mt-12 flex flex-col items-center gap-6 border-b border-t border-[var(--border-subtle)] py-8">
            <ColumnistSignature
              name={columnist.name}
              accentColor={accent.primary}
              size="md"
            />
            {col.featured_quote && (
              <QuoteShareButton
                columnistSlug={columnist.slug}
                columnSlug={col.slug}
                columnTitle={col.title}
                columnistName={columnist.name}
                quote={col.featured_quote}
              />
            )}
          </div>

          <ColumnReactions
            columnId={col.id}
            columnSlug={col.slug}
            columnistSlug={columnist.slug}
            initialCounts={col.reaction_counts}
          />

          <TomorrowTeaser currentColumnistSlug={columnist.slug} />

          <div className="mt-12 flex flex-col items-center gap-6 border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 text-center sm:flex-row sm:items-start sm:p-8 sm:text-left">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl font-black text-white"
              style={{ backgroundColor: accent.primary }}
            >
              {initials}
            </div>
            <div className="flex-1">
              <h4 className="mb-2 text-xl font-bold text-[var(--text-primary)]">
                {columnist.name}
              </h4>
              <p className="mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
                {columnist.bio_short}
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <Link
                  href={`/columns/${columnist.slug}`}
                  className="text-sm font-semibold no-underline hover:underline"
                  style={{ color: accent.primary }}
                >
                  Yazarın tüm yazılarını gör →
                </Link>
                <FollowColumnistButton
                  columnistSlug={columnist.slug}
                  columnistName={columnist.name}
                  accentColor={accent.primary}
                />
              </div>
            </div>
          </div>
        </article>

        {otherColumns && otherColumns.length > 0 && (
          <section className="mt-12">
            <div className="page-section-label mb-6">
              <span>Diğer yazıları</span>
              <span className="page-section-rule" aria-hidden="true" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {otherColumns.map((other) => (
                <Link
                  key={other.slug}
                  href={`/columns/${columnist.slug}/${other.slug}`}
                  className="border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 no-underline transition-colors hover:border-[var(--border-strong)]"
                  style={{
                    borderTopWidth: 3,
                    borderTopColor: accent.primary,
                  }}
                >
                  <time className="mb-2 block text-xs text-[var(--text-muted)]">
                    {new Date(other.published_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                  <h4 className="text-lg font-bold leading-snug text-[var(--text-primary)] transition-opacity hover:opacity-80">
                    {other.title}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
