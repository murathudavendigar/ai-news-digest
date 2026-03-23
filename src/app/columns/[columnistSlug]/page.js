import { supabase } from "@/app/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";

export async function generateMetadata({ params }) {
  const { columnistSlug } = await params;
  const { data } = await supabase
    .from("columnists")
    .select("name, title, expertise")
    .eq("slug", columnistSlug)
    .single();
  if (!data) return { title: "Yazar Bulunamadı" };
  return {
    title: `${data.name} — ${data.title} | HaberAI`,
    description: `${data.name}: ${data.expertise}`,
  };
}

export default async function ColumnistProfilePage({ params }) {
  const { columnistSlug } = await params;

  const { data: columnist } = await supabase
    .from("columnists")
    .select("*")
    .eq("slug", columnistSlug)
    .single();

  if (!columnist) notFound();

  const { data: columns } = await supabase
    .from("columns")
    .select("*")
    .eq("columnist_id", columnist.id)
    .order("published_at", { ascending: false });

  const initials = columnist.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="bg-white dark:bg-stone-800 rounded-3xl p-8 md:p-12 border border-stone-100 dark:border-stone-700 shadow-sm mb-12 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-amber-100 dark:bg-stone-700 shrink-0 flex items-center justify-center text-4xl font-black text-amber-700 dark:text-stone-300 border-4 border-white dark:border-stone-800 shadow-md">
          {initials}
        </div>
        <div className="flex-1">
          <h1
            className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-white mb-2"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
            {columnist.name}
          </h1>
          <p className="text-xl text-amber-600 dark:text-amber-400 font-medium mb-4">
            {columnist.title}
          </p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
            <span className="px-3 py-1 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm rounded-full">
              {columnist.expertise}
            </span>
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm rounded-full">
              {columns?.length || 0} yazı
            </span>
          </div>
          <p
            className="text-lg text-stone-700 dark:text-stone-300 leading-relaxed max-w-2xl"
            style={{ fontFamily: "var(--font-body, Georgia, serif)" }}>
            {columnist.bio_long}
          </p>
        </div>
      </header>

      <section>
        <h2
          className="text-2xl font-bold mb-8 pl-4 border-l-4 border-amber-500 text-stone-900 dark:text-white"
          style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
          Tüm Yazıları
        </h2>
        <div className="space-y-6">
          {!columns || columns.length === 0 ? (
            <p className="text-stone-500 italic p-4">
              Henüz yayınlanmış bir yazı bulunmuyor.
            </p>
          ) : (
            columns.map((col) => (
              <article
                key={col.id}
                className="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-sm hover:shadow-md transition-all group">
                <time className="text-sm font-medium text-amber-600 dark:text-amber-400 block mb-2">
                  {new Date(col.published_at).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <h3 className="text-2xl font-bold mb-3 text-stone-900 dark:text-white group-hover:text-amber-600 transition-colors">
                  <Link href={`/columns/${columnist.slug}/${col.slug}`}>
                    {col.title}
                  </Link>
                </h3>
                <p className="text-stone-600 dark:text-stone-300 line-clamp-3 mb-4 leading-relaxed">
                  {col.content
                    ?.split("\n")
                    .find((l) => l.trim() && !l.startsWith("#"))
                    ?.trim()}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <Link
                    href={`/columns/${columnist.slug}/${col.slug}`}
                    className="text-sm font-semibold text-stone-900 dark:text-white underline decoration-2 decoration-amber-200 underline-offset-4 hover:decoration-amber-500 transition-all">
                    Okumaya Devam Et →
                  </Link>
                  <span className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-900 px-3 py-1 rounded-full">
                    {col.read_time_minutes} dk
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
