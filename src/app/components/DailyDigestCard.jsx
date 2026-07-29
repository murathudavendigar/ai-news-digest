import { getDailySummary } from "@/app/lib/dailySummary";
import Link from "next/link";

/**
 * DailyDigestCard — Server component
 * Compact editorial teaser for today's digest.
 */
export default async function DailyDigestCard() {
  let data = null;

  try {
    data = await getDailySummary();
  } catch {
    return null;
  }

  if (!data || !data.headline) return null;

  const dateFormatted = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const introText = data.intro || data.bigPicture || "";
  const sentences = introText.match(/[^.!?]+[.!?]+/g) || [];
  const preview =
    sentences.slice(0, 3).join(" ").trim() || introText.slice(0, 200);

  return (
    <Link
      href="/digest"
      className="block h-full no-underline group p-5 md:p-6 transition-colors hover:bg-[var(--bg-secondary)]"
    >
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-primary)]">
            Günün özeti
          </span>
          {data.issueNumber && (
            <span className="text-[10px] font-bold text-[var(--text-muted)]">
              #{data.issueNumber}
            </span>
          )}
        </div>
        <span className="text-[11px] text-[var(--text-muted)] shrink-0">
          {dateFormatted}
        </span>
      </div>

      <h3
        className="text-lg md:text-xl font-black leading-snug mb-2 text-[var(--text-primary)]"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        {data.headline}
      </h3>

      <p className="text-sm leading-relaxed mb-4 line-clamp-3 text-[var(--text-secondary)]">
        {preview}
      </p>

      <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-[var(--accent-brand)] group-hover:gap-2 transition-all">
        Baskıyı oku
        <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
