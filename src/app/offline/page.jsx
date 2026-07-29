import Link from "next/link";
import RetryButton from "./RetryButton";

export const metadata = {
  title: "Çevrimdışı — HaberAI",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="page-shell flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <p className="page-masthead-kicker mb-3">HaberAI</p>
      <div className="mx-auto mb-5 h-0.5 w-16 bg-[var(--accent-brand)]" />
      <h1 className="page-masthead-title mb-3 !text-[2rem]">Çevrimdışısınız</h1>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
        İnternet bağlantın yok. Önbellekteki sayfalar yüklenebildiği kadar
        gösterilir.
      </p>

      <div className="mb-8 flex flex-wrap justify-center gap-3">
        <RetryButton />
        <Link
          href="/"
          className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)] no-underline"
        >
          Ana sayfa
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/digest" className="article-text-link accent">
          Günün özeti
        </Link>
        <Link href="/saved" className="article-text-link">
          Kaydedilenler
        </Link>
        <Link href="/columns" className="article-text-link">
          Köşe yazıları
        </Link>
      </div>
    </div>
  );
}
