/**
 * AI içerik şeffaflık satırı — özet / analiz bloklarının altında.
 */
export default function AiDisclosure({ sourceName, sourceUrl, compact = false }) {
  if (compact) {
    return (
      <p className="mt-2 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
        AI özet
        {sourceName ? ` · ${sourceName}` : ""}
        {sourceUrl ? (
          <>
            {" · "}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-brand)] no-underline hover:underline"
            >
              Kaynak
            </a>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <p className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
      Bu özet yapay zeka ile üretildi; asıl haber
      {sourceName ? ` ${sourceName}` : " kaynağa"} aittir.
      {sourceUrl ? (
        <>
          {" "}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--accent-brand)] no-underline hover:underline"
          >
            Kaynağa git ↗
          </a>
        </>
      ) : null}
    </p>
  );
}
