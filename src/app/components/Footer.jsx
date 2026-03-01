import { siteConfig } from "@/app/lib/siteConfig";
import Link from 'next/link';
import React from 'react'

export default function Footer() {
  return (
    <footer className="mt-20 border-t bg-stone-950 border-stone-800">
      <div className="px-4 py-10 mx-auto max-w-7xl sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <p
              className="text-xl font-black text-white"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
              }}>
              Haber<span className="text-amber-400">AI</span>
            </p>
            <p className="mt-1 text-xs text-stone-600">
              Yapay zeka destekli haber analizi
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-stone-500">
            <Link href="/" className="transition-colors hover:text-stone-300">
              Anasayfa
            </Link>
            <Link
              href="/summary"
              className="transition-colors hover:text-stone-300">
              Günün Özeti
            </Link>
            <Link
              href="/saved"
              className="transition-colors hover:text-stone-300">
              Kaydedilenler
            </Link>
            <Link
              href="/category/politics"
              className="transition-colors hover:text-stone-300">
              Politika
            </Link>
            <Link
              href="/category/business"
              className="transition-colors hover:text-stone-300">
              Ekonomi
            </Link>
            <Link
              href="/category/world"
              className="transition-colors hover:text-stone-300">
              Dünya
            </Link>
            <Link
              href="/category/technology"
              className="transition-colors hover:text-stone-300">
              Teknoloji
            </Link>
          </div>
          <p className="text-xs text-center text-stone-700 md:text-right">
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
