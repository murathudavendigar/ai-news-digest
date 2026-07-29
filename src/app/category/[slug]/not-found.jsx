import Link from "next/link";
import { CATEGORIES } from "@/app/lib/siteConfig";
import {
  StatusActions,
  StatusScreen,
  StatusSecondaryLink,
} from "@/app/components/StatusScreen";

export default function CategoryNotFound() {
  return (
    <StatusScreen
      kicker="Kategori"
      title="Kategori bulunamadı"
      lede="Bu kategori mevcut değil. Aşağıdakilerden birine geçebilirsin."
    >
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
      <StatusActions>
        <StatusSecondaryLink href="/">Ana sayfa</StatusSecondaryLink>
        <Link href="/digest" className="article-text-link accent">
          Günün özeti
        </Link>
      </StatusActions>
    </StatusScreen>
  );
}
