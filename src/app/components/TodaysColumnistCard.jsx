import { supabase } from "@/app/lib/supabase";
import {
  COLUMNIST_SCHEDULE,
  getColumnistAccent,
} from "@/app/lib/columnistConfig";
import Link from "next/link";

/**
 * TodaysColumnistCard — compact editorial teaser for today's columnist.
 */

function getTurkeyDay() {
  const now = new Date();
  return new Date(now.getTime() + 3 * 60 * 60 * 1000).getUTCDay();
}

function getTurkeyDate() {
  const now = new Date();
  const turkey = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return turkey.toISOString().split("T")[0];
}

export default async function TodaysColumnistCard() {
  const todaySlug = COLUMNIST_SCHEDULE[getTurkeyDay()];
  if (!todaySlug) return null;

  const accent = getColumnistAccent(todaySlug);

  const { data: columnist } = await supabase
    .from("columnists")
    .select("name, slug, title")
    .eq("slug", todaySlug)
    .single();

  if (!columnist) return null;

  const todayDate = getTurkeyDate();
  const { data: column } = await supabase
    .from("columns")
    .select("title, slug")
    .gte("published_at", `${todayDate}T00:00:00Z`)
    .lt("published_at", `${todayDate}T23:59:59Z`)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const columnTitle = column?.title || "Yazı henüz yayınlanmadı";
  const href = column
    ? `/columns/${todaySlug}/${column.slug}`
    : `/columns/${todaySlug}`;

  return (
    <Link
      href={href}
      className="group block h-full no-underline p-5 md:p-6 transition-colors hover:bg-[var(--bg-secondary)]"
    >
      <div className="flex items-center gap-4 h-full">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span
            className="w-2.5 h-2.5"
            style={{ backgroundColor: accent.primary }}
          />
          <span
            className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: accent.primary }}
          >
            Bugün
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">
            Köşe
          </p>
          <p
            className="text-base font-semibold leading-tight mb-0.5 text-[var(--text-primary)]"
            style={{
              fontFamily: "var(--font-signature, var(--font-display))",
            }}
          >
            {columnist.name}
          </p>
          <p className="text-sm truncate text-[var(--text-secondary)]">
            {columnTitle}
          </p>
        </div>

        <span
          className="text-sm font-black transition-transform group-hover:translate-x-0.5"
          style={{ color: accent.primary }}
          aria-hidden="true"
        >
          →
        </span>
      </div>
    </Link>
  );
}
