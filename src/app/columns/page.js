import { supabase } from "@/app/lib/supabase";
import { getTodaysColumnistSlug, COLUMNIST_SCHEDULE } from "@/app/lib/columnistConfig";
import Link from "next/link";

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
          <div className="bg-linear-to-r from-amber-50 to-orange-50 dark:from-stone-800 dark:to-stone-800 rounded-3xl p-8 border border-amber-100 dark:border-stone-700 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-32 h-32 rounded-full bg-amber-200 dark:bg-stone-700 shrink-0 flex items-center justify-center text-3xl font-black text-amber-700 dark:text-stone-300">
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
              <div className="mt-6">
                <Link
                  href={`/columns/${todayColumnist.slug}`}
                  className="inline-flex items-center justify-center px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors">
                  Tüm Yazıları →
                </Link>
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
          {otherColumnists.map((col) => (
            <Link
              key={col.id}
              href={`/columns/${col.slug}`}
              className="group bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-stone-100 dark:bg-stone-700 shrink-0 flex items-center justify-center text-sm font-black text-stone-500 dark:text-stone-300 group-hover:scale-105 transition-transform">
                {getInitials(col.name)}
              </div>
              <div>
                <h4 className="font-bold text-lg text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {col.name}
                </h4>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                  {col.title}
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                  {DAYS_TR[col.publish_day]} günleri yazar
                </p>
              </div>
            </Link>
          ))}
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
              className="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center text-xs font-black text-stone-500">
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
