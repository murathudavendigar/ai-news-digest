import { supabase } from "@/app/lib/supabase";
import { projectInfo } from "@/app/lib/authorConfig";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getColumnistAccent } from "@/app/lib/columnistConfig";
import ColumnistSignature from "@/app/components/ColumnistSignature";
import FollowColumnistButton from "@/app/components/FollowColumnistButton";

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

  // Calculate total views 
  const totalViews = columns?.reduce((sum, col) => sum + (col.view_count || 0), 0) || 0;

  const initials = columnist.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const accent = getColumnistAccent(columnist.slug);
  const baseUrl = projectInfo.siteUrl;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: columnist.name,
    jobTitle: columnist.title,
    description: columnist.expertise,
    url: `${baseUrl}/columns/${columnist.slug}`
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header
        className="rounded-3xl p-8 md:p-12 border border-stone-100 dark:border-stone-700 shadow-sm mb-12 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left relative overflow-hidden"
        style={{
          background: `linear-gradient(to bottom right, ${accent.light} 0%, transparent 100%)`,
        }}>
        {/* Subtle accent line on top */}
        <div 
          className="absolute top-0 left-0 right-0 h-1.5 opacity-80" 
          style={{ backgroundColor: accent.primary }} 
        />
        
        <div
          className="w-32 h-32 md:w-40 md:h-40 rounded-full shrink-0 flex items-center justify-center text-4xl font-black text-white border-4 border-white dark:border-stone-800 shadow-md z-10"
          style={{ backgroundColor: accent.primary }}>
          {initials}
        </div>
        <div className="flex-1 z-10 w-full">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
            <div>
              <h1
                className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-white mb-2"
                style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
                {columnist.name}
              </h1>
              <p 
                className="text-xl font-medium mb-4"
                style={{ color: accent.primary }}>
                {columnist.title}
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <FollowColumnistButton 
                columnistSlug={columnist.slug} 
                columnistName={columnist.name} 
                accentColor={accent.primary} 
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
            <span 
              className="px-3 py-1 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm rounded-full border"
              style={{ borderColor: accent.primary }}>
              {columnist.expertise}
            </span>
            <span className="px-3 py-1 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm rounded-full">
              {columns?.length || 0} yazı
            </span>
            {totalViews > 0 && (
              <span className="px-3 py-1 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm rounded-full flex items-center gap-1.5">
                <span className="text-xs">👁</span> {totalViews.toLocaleString('tr-TR')} okuma
              </span>
            )}
          </div>
          <p
            className="text-lg text-stone-800 dark:text-stone-200 leading-relaxed max-w-2xl mb-8"
            style={{ fontFamily: "var(--font-body, Georgia, serif)" }}>
            {columnist.bio_long}
          </p>
          <div className="flex justify-center md:justify-start">
            <ColumnistSignature name={columnist.name} accentColor={accent.primary} size="lg" />
          </div>
        </div>
      </header>

      <section>
        <h2
          className="text-2xl font-bold mb-8 pl-4 border-l-4 text-stone-900 dark:text-white"
          style={{ 
            fontFamily: "var(--font-display, Georgia, serif)",
            borderLeftColor: accent.primary 
          }}>
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
                className="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-sm hover:shadow-md transition-all group"
                style={{ borderLeftWidth: 3, borderLeftColor: accent.primary }}>
                <time 
                  className="text-sm font-medium block mb-2"
                  style={{ color: accent.primary }}>
                  {new Date(col.published_at).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <h3 className="text-2xl font-bold mb-3 text-stone-900 dark:text-white transition-colors"
                    style={{ '--tw-group-hover-color': accent.primary }}>
                  <Link 
                    href={`/columns/${columnist.slug}/${col.slug}`}
                    className="hover:opacity-80 transition-opacity">
                    {col.title}
                  </Link>
                </h3>
                <p className="text-stone-600 dark:text-stone-300 line-clamp-3 mb-4 leading-relaxed">
                  {col.content
                    ?.split("\n")
                    .find((l) => l.trim() && !l.startsWith("#"))
                    ?.trim()}
                </p>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
                  <Link
                    href={`/columns/${columnist.slug}/${col.slug}`}
                    className="text-sm font-semibold transition-all hover:opacity-80"
                    style={{ color: accent.primary }}>
                    Okumaya Devam Et →
                  </Link>
                  <div className="flex items-center gap-2">
                    {col.view_count > 0 && (
                      <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                        {col.view_count.toLocaleString('tr-TR')} okuma
                      </span>
                    )}
                    <span className="text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-700 px-3 py-1 rounded-full">
                      {col.read_time_minutes} dk
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
