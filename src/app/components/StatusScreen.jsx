import Link from "next/link";

/**
 * Ortak durum ekranı — not-found / error sayfaları için editorial dil.
 */
export function StatusScreen({
  kicker,
  mark,
  accent = "brand",
  title,
  lede,
  children,
}) {
  const bar =
    accent === "danger"
      ? "bg-[var(--danger)]"
      : "bg-[var(--accent-brand)]";

  return (
    <div className="page-shell flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {mark ? (
          <p
            className="select-none text-[6.5rem] font-black leading-none text-[var(--border-subtle)]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            {mark}
          </p>
        ) : null}
        {kicker ? (
          <p className={`page-masthead-kicker mb-3 ${mark ? "-mt-2" : ""}`}>
            {kicker}
          </p>
        ) : null}
        <div className={`mx-auto mb-5 h-0.5 w-16 ${bar}`} />
        <h1 className="page-masthead-title mb-2 !text-[1.75rem]">{title}</h1>
        {lede ? (
          <p className="mb-8 text-sm leading-relaxed text-[var(--text-secondary)]">
            {lede}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function StatusActions({ children }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {children}
    </div>
  );
}

export function StatusPrimaryButton({ onClick, children, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="border border-[var(--text-primary)] bg-[var(--text-primary)] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--bg-primary)] transition-opacity hover:opacity-90"
    >
      {children}
    </button>
  );
}

export function StatusPrimaryLink({ href, children }) {
  return (
    <Link
      href={href}
      className="border border-[var(--text-primary)] bg-[var(--text-primary)] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--bg-primary)] no-underline transition-opacity hover:opacity-90"
    >
      {children}
    </Link>
  );
}

export function StatusSecondaryLink({ href, children }) {
  return (
    <Link
      href={href}
      className="border border-[var(--border-subtle)] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)] no-underline transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
    >
      {children}
    </Link>
  );
}

export function StatusDevDetail({ error }) {
  if (process.env.NODE_ENV === "production" || !error?.message) return null;
  return (
    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left dark:border-red-800 dark:bg-red-950/30">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-red-500">
        Hata detayı
      </p>
      <p className="break-all font-mono text-xs text-red-700 dark:text-red-300">
        {error.message.slice(0, 200)}
      </p>
    </div>
  );
}
