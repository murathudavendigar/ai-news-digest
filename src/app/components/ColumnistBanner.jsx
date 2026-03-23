import { supabase } from "@/app/lib/supabase";
import { COLUMNIST_SCHEDULE } from "@/app/lib/columnistConfig";
import Link from "next/link";

function getTurkeyDay(offsetDays = 0) {
  const now = new Date();
  const turkey = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  turkey.setUTCDate(turkey.getUTCDate() + offsetDays);
  return turkey.getUTCDay();
}

function getTurkeyDate(offsetDays = 0) {
  const now = new Date();
  const turkey = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  turkey.setUTCDate(turkey.getUTCDate() + offsetDays);
  return turkey.toISOString().split("T")[0];
}

export default async function ColumnistBanner() {
  const todaySlug = COLUMNIST_SCHEDULE[getTurkeyDay(0)];
  const yesterdaySlug = COLUMNIST_SCHEDULE[getTurkeyDay(-1)];
  const tomorrowSlug = COLUMNIST_SCHEDULE[getTurkeyDay(1)];

  const slugs = [todaySlug, yesterdaySlug, tomorrowSlug].filter(Boolean);

  const { data: columnists } = await supabase
    .from("columnists")
    .select("name, slug, title, expertise, avatar_url")
    .in("slug", slugs);

  if (!columnists?.length) return null;

  const todayCol = columnists.find((c) => c.slug === todaySlug);
  const yesterdayCol = columnists.find((c) => c.slug === yesterdaySlug);
  const tomorrowCol = columnists.find((c) => c.slug === tomorrowSlug);

  // Try to get today's column
  const todayDate = getTurkeyDate(0);
  const { data: todayColumn } = await supabase
    .from("columns")
    .select("title, slug, content, read_time_minutes")
    .gte("published_at", `${todayDate}T00:00:00Z`)
    .lt("published_at", `${todayDate}T23:59:59Z`)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <section className="my-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <span>✍️</span> Bugünün Köşe Yazısı
        </h2>
        <Link
          href="/columns"
          className="text-sm font-semibold text-amber-600 hover:underline">
          Tüm Yazarlar →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Yesterday */}
        <div className="hidden lg:block lg:col-span-1 bg-white dark:bg-stone-800 rounded-2xl p-5 border border-stone-100 dark:border-stone-700 shadow-sm opacity-75 hover:opacity-100 transition-opacity">
          <div className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-4">
            Dünün Yazarı
          </div>
          {yesterdayCol && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-700 shrink-0 flex items-center justify-center text-xs font-black text-stone-500">
                {getInitials(yesterdayCol.name)}
              </div>
              <div>
                <div className="font-semibold text-sm text-stone-900 dark:text-white">
                  {yesterdayCol.name}
                </div>
                <div className="text-xs text-stone-500">{yesterdayCol.expertise}</div>
              </div>
            </div>
          )}
        </div>

        {/* Today — Main Card */}
        <div className="col-span-1 lg:col-span-2 bg-linear-to-br from-amber-50 to-orange-50 dark:from-stone-800 dark:to-stone-900 rounded-3xl p-6 md:p-8 border border-amber-100 dark:border-stone-700 shadow-md flex flex-col justify-center">
          {todayCol && (
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-amber-200 dark:bg-stone-700 shrink-0 border-2 border-white dark:border-stone-800 shadow-sm flex items-center justify-center text-lg font-black text-amber-700 dark:text-stone-300">
                {getInitials(todayCol.name)}
              </div>
              <div>
                <div className="font-bold text-lg text-stone-900 dark:text-white">
                  {todayCol.name}
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  {todayCol.title}
                </div>
              </div>
            </div>
          )}

          {todayColumn ? (
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-white mb-3 leading-tight">
                {todayColumn.title}
              </h3>
              <p className="text-stone-700 dark:text-stone-300 mb-6 line-clamp-3 leading-relaxed">
                {todayColumn.content
                  ?.split("\n")
                  .find((l) => l.trim() && !l.startsWith("#"))
                  ?.trim()}
              </p>
              <Link
                href={`/columns/${todaySlug}/${todayColumn.slug}`}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors shadow-sm">
                Yazıyı Oku →
              </Link>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <div className="text-4xl mb-4">🕰️</div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
                Günün Yazısı Hazırlanıyor
              </h3>
              <p className="text-stone-600 dark:text-stone-400">
                Saat 10:00&apos;da yayınlanacak.
              </p>
            </div>
          )}
        </div>

        {/* Tomorrow */}
        <div className="hidden lg:flex flex-col lg:col-span-1 bg-white dark:bg-stone-800 rounded-2xl p-5 border border-stone-100 dark:border-stone-700 shadow-sm opacity-75">
          <div className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-4">
            Yarının Yazarı
          </div>
          {tomorrowCol && (
            <div className="flex flex-col items-center text-center flex-1 justify-center">
              <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-700 mb-3 flex items-center justify-center text-xl font-black text-stone-500 dark:text-stone-300">
                {getInitials(tomorrowCol.name)}
              </div>
              <div className="font-bold text-stone-900 dark:text-white mb-1">
                {tomorrowCol.name}
              </div>
              <div className="text-xs text-stone-500">{tomorrowCol.title}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
