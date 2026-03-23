import { supabase } from "@/app/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import ColumnReactions from "./ColumnReactions";

export async function generateMetadata({ params }) {
  const { columnSlug } = await params;
  const { data } = await supabase
    .from("columns")
    .select("title, subtitle")
    .eq("slug", columnSlug)
    .single();
  if (!data) return { title: "Yazı Bulunamadı" };
  return {
    title: `${data.title} | HaberAI`,
    description: data.subtitle || data.title,
    openGraph: {
      title: data.title,
      description: data.subtitle || data.title,
      type: "article",
      locale: "tr_TR",
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
      <article className="bg-white dark:bg-stone-800 rounded-3xl p-6 md:p-12 shadow-sm border border-stone-100 dark:border-stone-700">
        <header className="mb-10 text-center border-b border-stone-100 dark:border-stone-700 pb-10">
          <div className="mb-6 inline-flex flex-col items-center">
            <Link href={`/columns/${columnist.slug}`} className="group">
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-stone-700 mx-auto mb-3 flex items-center justify-center text-2xl font-black text-amber-700 dark:text-stone-300 border-2 border-transparent group-hover:border-amber-500 transition-colors">
                {initials}
              </div>
              <div className="font-bold text-stone-900 dark:text-white group-hover:text-amber-600 transition-colors">
                {columnist.name}
              </div>
            </Link>
            <div className="text-sm text-stone-500 mt-1">
              {new Date(col.published_at).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              <span className="mx-2">·</span>
              {col.read_time_minutes} dk okuma
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

        <ColumnReactions
          columnId={col.id}
          columnSlug={col.slug}
          columnistSlug={columnist.slug}
          initialCounts={col.reaction_counts}
        />

        {/* Author card */}
        <div className="mt-12 bg-stone-50 dark:bg-stone-900/50 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
          <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-stone-700 shrink-0 flex items-center justify-center text-3xl font-black text-amber-700 dark:text-stone-300">
            {initials}
          </div>
          <div>
            <h4 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
              {columnist.name}
            </h4>
            <p className="text-stone-600 dark:text-stone-400 text-sm mb-4 leading-relaxed">
              {columnist.bio_short}
            </p>
            <Link
              href={`/columns/${columnist.slug}`}
              className="text-amber-600 dark:text-amber-400 font-semibold text-sm hover:underline">
              Yazarın tüm yazılarını gör →
            </Link>
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
                className="bg-white dark:bg-stone-800 rounded-xl p-5 shadow-sm border border-stone-100 dark:border-stone-700 hover:shadow-md transition-all group">
                <time className="text-xs text-stone-500 mb-2 block">
                  {new Date(other.published_at).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <h4 className="font-bold text-lg text-stone-900 dark:text-white group-hover:text-amber-600 transition-colors leading-snug">
                  {other.title}
                </h4>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
