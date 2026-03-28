import { supabase } from "@/app/lib/supabase";
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://haberai.com.tr';

  return {
    title: `${column.title} — ${columnist?.name || 'HaberAI'} | HaberAI`,
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

  // Get columnist
  const { data: columnist } = await supabase
    .from("columnists")
    .select("*")
    .eq("slug", columnistSlug)
    .single();

  if (!columnist) notFound();

  // Get column
  const { data: col } = await supabase
    .from("columns")
    .select("*")
    .eq("slug", columnSlug)
    .eq("columnist_id", columnist.id)
    .single();

  if (!col) notFound();

  // Get poll
  const { data: pollData } = await supabase
    .from("column_polls")
    .select("id")
    .eq("column_id", col.id)
    .maybeSingle();

  // Other columns by same author
  const { data: otherColumns } = await supabase
    .from("columns")
    .select("title, slug, published_at")
    .eq("columnist_id", columnist.id)
    .neq("id", col.id)
    .order("published_at", { ascending: false })
    .limit(3);

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
            className="text-2xl font-bold mt-8 mb-4 text-stone-900 dark:text-white">
            {trimmed.replace("## ", "")}
          </h2>
        );
      }
      return (
        <p
          key={i}
          className="mb-6 leading-relaxed text-lg text-stone-800 dark:text-stone-200">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <ArticleViewTracker columnistSlug={columnist.slug} columnSlug={col.slug} />
      <article className="bg-white dark:bg-stone-800 rounded-3xl p-6 md:p-12 shadow-sm border border-stone-100 dark:border-stone-700 relative overflow-hidden">
        {/* Accent top bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-1.5 opacity-80" 
          style={{ backgroundColor: accent.primary }} 
        />
        
        <header className="mb-10 text-center pb-10 relative">
          <div className="mb-6 inline-flex flex-col items-center">
            <Link href={`/columns/${columnist.slug}`} className="group">
              <div 
                className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-black text-white shadow-sm border-2 border-transparent transition-transform group-hover:scale-105"
                style={{ backgroundColor: accent.primary }}>
                {initials}
              </div>
              <div 
                className="font-bold transition-colors"
                style={{ color: accent.primary }}>
                {columnist.name}
              </div>
            </Link>
            <div className="text-sm text-stone-500 mt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <span>
                  {new Date(col.published_at).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="text-stone-300 dark:text-stone-600">•</span>
                <span>{col.read_time_minutes} dk okuma</span>
                {col.view_count > 0 && (
                  <>
                    <span className="text-stone-300 dark:text-stone-600">•</span>
                    <span>{col.view_count.toLocaleString('tr-TR')} okuma</span>
                  </>
                )}
              </div>
              <div className="hidden sm:block text-stone-300 dark:text-stone-600">•</div>
              <ArticleShareButton 
                url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://haberai.com.tr'}/columns/${columnist.slug}/${col.slug}`} 
                title={col.title} 
                columnistName={columnist.name} 
              />
            </div>
          </div>

          <h1
            className="text-4xl md:text-5xl font-black text-stone-900 dark:text-white leading-tight mb-4"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
            {col.title}
          </h1>
          {col.subtitle && (
            <h2 className="text-xl md:text-2xl text-stone-600 dark:text-stone-400 font-medium">
              {col.subtitle}
            </h2>
          )}
        </header>

        <div
          className="prose-container"
          style={{ fontFamily: "var(--font-body, Georgia, serif)" }}>
          {formatContent(col.content)}
        </div>

        {pollData?.id && (
          <ColumnPoll pollId={pollData.id} columnistAccent={accent.primary} />
        )}

        {/* Signature + Divider */}
        <div className="mt-12 mb-8 border-t border-b py-8 border-stone-100 dark:border-stone-700 flex flex-col items-center gap-6">
          <ColumnistSignature name={columnist.name} accentColor={accent.primary} size="md" />
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

        {/* Tomorrow Teaser */}
        <TomorrowTeaser currentColumnistSlug={columnist.slug} />

        {/* Author card */}
        <div className="mt-12 bg-stone-50 dark:bg-stone-900/50 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left border border-stone-100 dark:border-stone-800">
          <div 
            className="w-24 h-24 rounded-full shrink-0 flex items-center justify-center text-3xl font-black text-white shadow-sm"
            style={{ backgroundColor: accent.primary }}>
            {initials}
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
              {columnist.name}
            </h4>
            <p className="text-stone-600 dark:text-stone-400 text-sm mb-5 leading-relaxed">
              {columnist.bio_short}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href={`/columns/${columnist.slug}`}
                className="font-semibold text-sm hover:underline"
                style={{ color: accent.primary }}>
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

      {/* Other columns */}
      {otherColumns && otherColumns.length > 0 && (
        <section className="mt-12">
          <h3
            className="text-2xl font-bold mb-6 pl-4 border-l-4 border-stone-300 dark:border-stone-600"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
            Diğer Yazıları
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherColumns.map((other) => (
              <Link
                key={other.slug}
                href={`/columns/${columnist.slug}/${other.slug}`}
                className="bg-white dark:bg-stone-800 rounded-xl p-5 shadow-sm border border-stone-100 dark:border-stone-700 hover:shadow-md transition-all group"
                style={{ borderTopWidth: 3, borderTopColor: getColumnistAccent(columnist.slug).primary }}>
                <time className="text-xs text-stone-500 mb-2 block">
                  {new Date(other.published_at).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <h4 
                  className="font-bold text-lg text-stone-900 dark:text-white transition-colors leading-snug"
                  style={{ '--tw-group-hover-color': getColumnistAccent(columnist.slug).primary }}>
                  <span className="hover:opacity-80 transition-opacity">
                    {other.title}
                  </span>
                </h4>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
