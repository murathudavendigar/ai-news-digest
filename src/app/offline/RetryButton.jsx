"use client";

export default function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="border border-[var(--text-primary)] bg-[var(--text-primary)] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--bg-primary)]"
    >
      Tekrar dene
    </button>
  );
}
