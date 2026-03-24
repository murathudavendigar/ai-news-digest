import { supabase } from "@/app/lib/supabase";
import { getTodaysColumnistSlug, COLUMNIST_SCHEDULE, getColumnistAccent } from "@/app/lib/columnistConfig";
import Link from "next/link";
import ColumnistSignature from "@/app/components/ColumnistSignature";
import FollowColumnistButton from "@/app/components/FollowColumnistButton";

export const metadata = {
  title: "Köşe Yazıları | HaberAI",
  description:
    "7 bağımsız AI yazarından her gün yeni bir köşe yazısı. Politikadan spora, teknolojiden kültüre.",
};

export default async function ColumnsIndexPage() {
  const todaySlug = getTodaysColumnistSlug();

  const { data: columnists } = await supabase
    .from("columnists")
    .select("*")
    .eq("is_active", true)
    .order("publish_day", { ascending: true });

  const { data: columns } = await supabase
    .from("columns")
    .select("*, columnist:columnist_id(name, slug, title, avatar_url)")
    .order("published_at", { ascending: false })
    .limit(10);

  const todayColumnist = columnists?.find((c) => c.slug === todaySlug);
  const otherColumnists =
    columnists?.filter((c) => c.slug !== todaySlug) || [];

  const DAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

  const getInitials = (name) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-12 text-center">
        <h1
          className="text-4xl font-bold mb-4 text-stone-900 dark:text-stone-100"
          style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
          Köşe Yazıları
        </h1>
        <p className="text-xl text-stone-600 dark:text-stone-400">
          Her gün yeni bir yazar, yeni bir bakış açısı.
        </p>
      </header>

      {/* Today's Columnist */}
      {todayColumnist && (
        <section className="mb-16">
          <h2
            className="text-2xl font-bold mb-6 flex items-center gap-2"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
            <span>✨</span> Bugünün Yazarı
          </h2>
          <div
            className="bg-linear-to-r from-amber-50 to-orange-50 dark:from-stone-800 dark:to-stone-800 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start transition-all"
            style={{
              borderLeftWidth: 6,
              borderLeftColor: getColumnistAccent(todaySlug).primary,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderRightWidth: 1,
              borderColor: 'var(--tw-border-amber-100)',
            }}>
            <div
              className="w-32 h-32 rounded-full shrink-0 flex items-center justify-center text-3xl font-black text-white shadow-inner"
              style={{ backgroundColor: getColumnistAccent(todaySlug).primary }}>
              {getInitials(todayColumnist.name)}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-3xl font-bold text-stone-900 dark:text-white mb-2">
                {todayColumnist.name}
              </h3>
              <p className="text-lg text-amber-600 dark:text-amber-400 font-medium mb-4">
                {todayColumnist.title}
              </p>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed max-w-2xl">
                {todayColumnist.bio_short}
              </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <Link
                    href={`/columns/${todayColumnist.slug}`}
                    className="inline-flex items-center justify-center px-6 py-3 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-medium rounded-xl transition-colors">
                    Tüm Yazıları →
                  </Link>
                  <FollowColumnistButton
                    columnistSlug={todayColumnist.slug}
                    columnistName={todayColumnist.name}
                    accentColor={getColumnistAccent(todaySlug).primary}
                  />
                </div>
              </div>
          </div>
        </section>
      )}

      {/* Other Columnists Grid */}
      <section className="mb-16">
        <h2
          className="text-2xl font-bold mb-6"
          style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
          Tüm Yazarlarımız
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherColumnists.map((col) => {
            const accent = getColumnistAccent(col.slug);
            return (
              <div
                key={col.id}
                className="group bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                style={{ borderLeftWidth: 4, borderLeftColor: accent.primary }}>
                <Link href={`/columns/${col.slug}`} className="flex items-start gap-4 mb-4 flex-1">
                  <div
                    className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-sm font-black text-white group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: accent.primary }}>
                    {getInitials(col.name)}
                  </div>
                  <div>
                    <h4
                      className="font-bold text-lg transition-colors"
                      style={{ color: 'var(--tw-text-stone-900)' /* Hover handled by CSS usually, but inline overrides. Let's keep it simple. */ }}>
                      <span className="text-stone-900 dark:text-white group-hover:opacity-80 transition-opacity">
                        {col.name}
                      </span>
                    </h4>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                      {col.title}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                      {DAYS_TR[col.publish_day]} günleri yazar
                    </p>
                  </div>
                </Link>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-100 dark:border-stone-700">
                  <ColumnistSignature name={col.name} accentColor={accent.primary} size="sm" />
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

      {/* Recent Columns Feed */}
      <section>
        <h2
          className="text-2xl font-bold mb-6"
          style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
          Son Yazılar
        </h2>
        <div className="space-y-6">
          {columns?.map((col) => (
            <article
              key={col.id}
              className="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-sm hover:shadow-md transition-all"
              style={{ borderLeftWidth: 3, borderLeftColor: getColumnistAccent(col.columnist?.slug).primary }}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ backgroundColor: getColumnistAccent(col.columnist?.slug).primary }}>
                  {getInitials(col.columnist?.name || "?")}
                </div>
                <div>
                  <Link
                    href={`/columns/${col.columnist?.slug}`}
                    className="font-semibold text-stone-900 dark:text-white hover:underline">
                    {col.columnist?.name}
                  </Link>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {new Date(col.published_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">
                <Link
                  href={`/columns/${col.columnist?.slug}/${col.slug}`}
                  className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  {col.title}
                </Link>
              </h3>
              <p className="text-stone-600 dark:text-stone-300 line-clamp-3 mb-4">
                {col.content
                  ?.split("\n")
                  .find((l) => l.trim() && !l.startsWith("#"))
                  ?.trim()}
              </p>
              <div className="flex items-center justify-between text-sm text-stone-500 dark:text-stone-400 border-t border-stone-100 dark:border-stone-700 pt-4">
                <span className="bg-stone-100 dark:bg-stone-700 px-3 py-1 rounded-full text-xs">
                  {col.read_time_minutes} dk okuma
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
