import { getDailySummary } from "@/app/lib/dailySummary";
import Link from "next/link";

/**
 * DailyDigestCard — Server component
 * Fetches today's digest and renders a compact card.
 * Hides silently on error.
 */
export default async function DailyDigestCard() {
  let data = null;

  try {
    data = await getDailySummary();
  } catch {
    // Hide silently — don't break homepage
    return null;
  }

  if (!data || !data.headline) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const dateFormatted = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Extract first 2-3 sentences from intro
  const introText = data.intro || data.bigPicture || "";
  const sentences = introText.match(/[^.!?]+[.!?]+/g) || [];
  const preview = sentences.slice(0, 3).join(" ").trim() || introText.slice(0, 200);

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(to top, var(--bg-elevated), color-mix(in srgb, var(--bg-elevated) 85%, transparent))`,
        borderLeft: "3px solid var(--accent-primary)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
              style={{
                background: "var(--accent-primary)",
                color: "var(--text-inverted)",
              }}
            >
              Günün Özeti
            </span>
            {data.issueNumber && (
              <span
                className="text-[10px] font-bold"
                style={{ color: "var(--text-muted)" }}
              >
                #{data.issueNumber}
              </span>
            )}
          </div>
          <span
            className="text-[11px]"
            style={{ color: "var(--text-muted)" }}
          >
            {dateFormatted}
          </span>
        </div>

        {/* Headline */}
        <h3
          className="text-lg font-bold mb-2 leading-tight"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-display, Georgia, serif)",
          }}
        >
          {data.headline}
        </h3>

        {/* Content preview */}
        <p
          className="text-sm leading-relaxed mb-4 line-clamp-3"
          style={{ color: "var(--text-secondary)" }}
        >
          {preview}
        </p>

        {/* Footer */}
        <Link
          href={`/digest/${todayStr}`}
          className="inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: "var(--accent-primary)" }}
        >
          Devamını oku
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
