import { supabase } from "@/app/lib/supabase";
import {
  COLUMNIST_SCHEDULE,
  getColumnistAccent,
} from "@/app/lib/columnistConfig";
import Link from "next/link";

/**
 * TodaysColumnistCard — compact horizontal teaser
 * Shows today's columnist and their latest column.
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

  // Fetch columnist info
  const { data: columnist } = await supabase
    .from("columnists")
    .select("name, slug, title")
    .eq("slug", todaySlug)
    .single();

  if (!columnist) return null;

  // Fetch today's column
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
      className="group flex items-center gap-3 p-4 transition-all hover:shadow-md"
      style={{
        background: accent.light + "18", // very subtle tint (hex alpha ~10%)
        border: `1px solid ${accent.primary}33`, // 20% opacity
        borderRadius: "var(--radius-lg)",
      }}
    >
      {/* Left: colored dot + label */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: accent.primary }}
        />
        <span
          className="text-[9px] font-black uppercase tracking-widest"
          style={{ color: accent.primary }}
        >
          Bugün
        </span>
      </div>

      {/* Center: name + title */}
      <div className="flex-1 min-w-0">
        <p
          className="text-base font-semibold leading-tight mb-0.5"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-signature, var(--font-display))",
          }}
        >
          {columnist.name}
        </p>
        <p
          className="text-sm truncate"
          style={{ color: "var(--text-secondary)" }}
        >
          {columnTitle}
        </p>
      </div>

      {/* Right: arrow */}
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-transform group-hover:translate-x-0.5"
        style={{ backgroundColor: accent.primary + "15" }}
      >
        <svg
          className="w-4 h-4"
          style={{ color: accent.primary }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
