import { supabase } from "@/app/lib/supabase";
import { COLUMNIST_SCHEDULE, getColumnistAccent } from "@/app/lib/columnistConfig";
import Link from "next/link";

function getTomorrowColumnist(currentSlug) {
  const now = new Date();
  const turkeyNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  // Try tomorrow first, then day-after-tomorrow if same as current
  for (let offset = 1; offset <= 2; offset++) {
    const future = new Date(turkeyNow);
    future.setUTCDate(future.getUTCDate() + offset);
    const slug = COLUMNIST_SCHEDULE[future.getUTCDay()];
    if (slug && slug !== currentSlug) return slug;
  }
  return null;
}

export default async function TomorrowTeaser({ currentColumnistSlug }) {
  const tomorrowSlug = getTomorrowColumnist(currentColumnistSlug);
  if (!tomorrowSlug) return null;

  const { data: columnist } = await supabase
    .from("columnists")
    .select("name, slug, title, expertise")
    .eq("slug", tomorrowSlug)
    .single();

  if (!columnist) return null;

  const accent = getColumnistAccent(tomorrowSlug);

  return (
    <div
      className="mt-12 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 bg-white dark:bg-stone-800/50"
      style={{ borderLeftWidth: 4, borderLeftColor: accent.primary }}>
      <div className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
        Yarın
      </div>
      <div className="flex items-center gap-3 mb-3">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: accent.primary }}
        />
        <span className="font-bold text-lg text-stone-900 dark:text-white">
          {columnist.name}
        </span>
      </div>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">
        {columnist.title}
      </p>
      <p className="text-sm text-stone-600 dark:text-stone-300 italic mb-4">
        &ldquo;{columnist.expertise} üzerine yarın saat 10:00&apos;da&rdquo;
      </p>
      <Link
        href={`/columns/${columnist.slug}`}
        className="text-sm font-semibold transition-colors hover:underline"
        style={{ color: accent.primary }}>
        {columnist.name.split(" ")[0]}&apos;i takip et →
      </Link>
    </div>
  );
}
