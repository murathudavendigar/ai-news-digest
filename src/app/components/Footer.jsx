import { siteConfig } from "@/app/lib/siteConfig";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800">
      <div className="px-4 py-10 mx-auto max-w-7xl sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <p
              className="text-xl font-black text-stone-900 dark:text-white"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
              }}>
              Haber
              <span className="text-amber-500 dark:text-amber-400">AI</span>
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-600">
              Yapay zeka destekli haber analizi
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-stone-500 dark:text-stone-400">
            <Link
              href="/"
              className="transition-colors hover:text-stone-900 dark:hover:text-stone-200">
              Anasayfa
            </Link>
            <Link
              href="/summary"
              className="transition-colors hover:text-stone-900 dark:hover:text-stone-200">
              Günün Özeti
            </Link>
            <Link
              href="/saved"
              className="transition-colors hover:text-stone-900 dark:hover:text-stone-200">
              Kaydedilenler
            </Link>
            <Link
              href="/category/politics"
              className="transition-colors hover:text-stone-900 dark:hover:text-stone-200">
              Politika
            </Link>
            <Link
              href="/category/business"
              className="transition-colors hover:text-stone-900 dark:hover:text-stone-200">
              Ekonomi
            </Link>
            <Link
              href="/category/world"
              className="transition-colors hover:text-stone-900 dark:hover:text-stone-200">
              Dünya
            </Link>
            <Link
              href="/category/technology"
              className="transition-colors hover:text-stone-900 dark:hover:text-stone-200">
              Teknoloji
            </Link>
          </div>
          <p className="text-xs text-center text-stone-500 dark:text-stone-600 md:text-right">
            © {new Date().getFullYear()} {siteConfig.name}
            <span className="ml-2 text-stone-400 dark:text-stone-500">
              v{siteConfig.version}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
