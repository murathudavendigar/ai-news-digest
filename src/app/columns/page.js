import { supabase } from "@/app/lib/supabase";
import { getTodaysColumnistSlug, getColumnistAccent, getSevenDaysAgoISO } from "@/app/lib/columnistConfig";
import Link from "next/link";
import ColumnistSignature from "@/app/components/ColumnistSignature";
import FollowColumnistButton from "@/app/components/FollowColumnistButton";

export const metadata = {
  title: "Köşe Yazıları | HaberAI",
  description:
    "7 bağımsız AI yazarından her gün yeni bir köşe yazısı. Politikadan spora, teknolojiden kültüre.",
};

const DAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

const getInitials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export default async function ColumnsIndexPage() {
  const todaySlug = getTodaysColumnistSlug();
  const sevenDaysAgo = getSevenDaysAgoISO();

  const [
    { data: columnists },
    { data: recentColumns },
    { data: topColumns }
  ] = await Promise.all([
    supabase
      .from("columnists")
      .select("*")
      .eq("is_active", true)
      .order("publish_day", { ascending: true }),
    supabase
      .from("columns")
      .select("*, columnist:columnist_id(name, slug, title, avatar_url)")
      .order("published_at", { ascending: false })
      .limit(20),
    supabase
      .from("columns")
      .select("*, columnist:columnist_id(name, slug, title, avatar_url)")
      .gte("published_at", sevenDaysAgo)
      .order("view_count", { ascending: false })
      .limit(3)
  ]);

  const todayColumnist = columnists?.find((c) => c.slug === todaySlug);
  const todayColumn = recentColumns?.find(c => c.columnist_id === todayColumnist?.id);

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

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <div>
          <h1
            className="text-4xl md:text-5xl font-bold mb-2 text-stone-900 dark:text-stone-100 tracking-tight"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
            Köşe Yazıları
          </h1>
          <p className="text-xl text-stone-600 dark:text-stone-400">
            Her gün yeni bir yazar, yeni bir bakış açısı.
          </p>
        </div>
        <a href="#tum-yazarlar" className="text-stone-500 hover:text-stone-900 dark:hover:text-white font-medium transition-colors inline-flex items-center gap-1">
          Tüm Yazarlar
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
        </a>
      </header>

      {/* TODAY'S COLUMN */}
      {todayColumnist && todayColumn && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2
              className="text-2xl font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500"
              style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
              BUGÜN
            </h2>
            <div className="h-px bg-stone-200 dark:bg-stone-800 flex-1"></div>
          </div>
          
          <div
            className="group block relative bg-white dark:bg-stone-900 rounded-3xl p-8 md:p-12 shadow-sm hover:shadow-lg transition-all border border-stone-100 dark:border-stone-800 overflow-hidden"
          >
            <div 
              className="absolute top-0 left-0 right-0 h-2 opacity-90 transition-opacity" 
              style={{ backgroundColor: getColumnistAccent(todaySlug).primary }} 
            />
            
            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
              <div className="shrink-0 flex flex-col items-center gap-3">
                <Link href={`/columns/${todayColumnist.slug}`}>
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-inner hover:scale-105 transition-transform"
                    style={{ backgroundColor: getColumnistAccent(todaySlug).primary }}>
                    {getInitials(todayColumnist.name)}
                  </div>
                </Link>
                <div className="text-center">
                  <Link href={`/columns/${todayColumnist.slug}`} className="font-bold text-lg hover:underline block text-stone-900 dark:text-white">
                    {todayColumnist.name}
                  </Link>
                  <p className="text-xs text-stone-500 max-w-30 mx-auto leading-tight mt-1">
                    {todayColumnist.title}
                  </p>
                </div>
              </div>

              <div className="flex-1 flex flex-col h-full">
                <Link href={`/columns/${todayColumnist.slug}/${todayColumn.slug}`} className="flex-1">
                  <h3 
                    className="text-3xl md:text-5xl font-bold text-stone-900 dark:text-white mb-4 leading-tight group-hover:opacity-80 transition-opacity"
                    style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
                  >
                    {todayColumn.title}
                  </h3>
                  
                  <p className="text-stone-600 dark:text-stone-300 text-lg leading-relaxed mb-6 line-clamp-3 md:line-clamp-2">
                    {todayColumn.content
                      ?.split("\n")
                      .find((l) => l.trim() && !l.startsWith("#"))
                      ?.trim()}
                  </p>
                </Link>

                <div className="flex flex-wrap items-center justify-between gap-4 mt-auto pt-6 border-t border-stone-100 dark:border-stone-800 w-full">
                  <div className="flex items-center gap-3 text-sm text-stone-500 font-medium">
                    <span>{todayColumn.read_time_minutes} dk okuma</span>
                    {todayColumn.view_count > 0 && (
                      <>
                        <span>•</span>
                        <span>{todayColumn.view_count.toLocaleString('tr-TR')} okuyucu</span>
                      </>
                    )}
                  </div>
                  <Link
                    href={`/columns/${todayColumnist.slug}/${todayColumn.slug}`}
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold rounded-full transition-colors text-sm"
                  >
                    Oku <span className="ml-1">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BU HAFTA (Horizontal Scroll) */}
      {thisWeekColumns.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2
              className="text-xl font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500"
              style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
              BU HAFTA
            </h2>
            <div className="h-px bg-stone-200 dark:bg-stone-800 flex-1"></div>
          </div>

          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 snap-x gap-4 scrollbar-hide">
            {thisWeekColumns.map((col) => {
              const accent = getColumnistAccent(col.columnist.slug);
              return (
                <Link
                  key={col.id}
                  href={`/columns/${col.columnist.slug}/${col.slug}`}
                  className="w-70 sm:w-[320px] shrink-0 snap-start bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-100 dark:border-stone-800 flex flex-col group hover:shadow-md transition-shadow relative overflow-hidden"
                  style={{ borderTopWidth: 4, borderTopColor: accent.primary }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                      style={{ backgroundColor: accent.primary }}>
                      {getInitials(col.columnist.name)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-stone-900 dark:text-white leading-tight">
                        {col.columnist.name}
                      </span>
                      <time className="text-xs text-stone-500">
                         {new Date(col.published_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                      </time>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg leading-snug mb-3 group-hover:opacity-80 transition-opacity">
                    {col.title}
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-3 mt-auto">
                    {col.content?.split("\n").find((l) => l.trim() && !l.startsWith("#"))?.trim()}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* EN ÇOK OKUNANLAR */}
      {topColumns?.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2
              className="text-xl font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500"
              style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
              Haftanın En Çok Okunanları
            </h2>
            <div className="h-px bg-stone-200 dark:bg-stone-800 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topColumns.map((col, idx) => (
              <Link
                key={col.id}
                href={`/columns/${col.columnist.slug}/${col.slug}`}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors group"
              >
                <div className="text-4xl font-black text-stone-200 dark:text-stone-800 font-serif leading-none mt-1 group-hover:text-stone-300 dark:group-hover:text-stone-700 transition-colors">
                  0{idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-white leading-snug mb-1 group-hover:underline decoration-stone-300">
                    {col.title}
                  </h4>
                  <div className="text-sm text-stone-500 flex items-center gap-2">
                    <span className="font-medium" style={{ color: getColumnistAccent(col.columnist.slug).primary }}>
                      {col.columnist.name}
                    </span>
                    <span>•</span>
                    <span>{col.view_count?.toLocaleString('tr-TR')} okuma</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ALL COLUMNISTS GRID */}
      <section id="tum-yazarlar" className="mb-12 scroll-mt-8">
        <div className="flex items-center gap-3 mb-8">
          <h2
            className="text-xl font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
            Tüm Yazarlar
          </h2>
          <div className="h-px bg-stone-200 dark:bg-stone-800 flex-1"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {columnists?.map((col) => {
            const accent = getColumnistAccent(col.slug);
            return (
              <div
                key={col.id}
                className="flex flex-col bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-100 dark:border-stone-800 hover:shadow-md transition-shadow"
              >
                <Link href={`/columns/${col.slug}`} className="flex items-center gap-4 mb-5 group">
                  <div
                    className="w-16 h-16 rounded-full shrink-0 flex items-center justify-center text-xl font-black text-white group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: accent.primary }}>
                    {getInitials(col.name)}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-stone-900 dark:text-white group-hover:opacity-80 transition-opacity">
                      {col.name}
                    </h4>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      {col.title}
                    </p>
                  </div>
                </Link>
                
                <div className="mt-auto pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
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

    </main>
  );
}
