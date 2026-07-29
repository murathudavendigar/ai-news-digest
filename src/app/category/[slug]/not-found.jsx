import Link from "next/link";
import { CATEGORIES } from "@/app/lib/siteConfig";

export default function CategoryNotFound() {
  return (
    <div className="page-shell flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <p className="page-masthead-kicker mb-3">Kategori</p>
        <div className="mx-auto mb-5 h-0.5 w-16 bg-[var(--accent-brand)]" />
        <h1 className="page-masthead-title mb-2 !text-[1.75rem]">
          Kategori bulunamadı
        </h1>
        <p className="mb-8 text-sm text-[var(--text-secondary)]">
          Bu kategori mevcut değil. Aşağıdakilerden birine geçebilirsin.
        </p>

        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.slice(0, 9).map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2.5 text-left text-sm font-semibold text-[var(--text-secondary)] no-underline transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              {cat.title}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="article-text-link">
            Ana sayfa
          </Link>
          <Link href="/digest" className="article-text-link accent">
            Günün özeti
          </Link>
        </div>
      </div>
    </div>
  );
}
