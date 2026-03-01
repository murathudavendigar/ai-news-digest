import { Playfair_Display, Source_Serif_4 } from "next/font/google";
import Navigation from "@/app/components/Navigation";
import Link from "next/link";
import "./globals.css";


const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: "HaberAI - Yapay Zeka Destekli Haber Analizi",
  description:
    "Türkiye ve dünyadan en güncel haberler — AI destekli güvenilirlik analizi ile",
};

export default function RootLayout({ children }) {
  const now = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <html lang="tr" className={`${playfair.variable} ${sourceSerif.variable}`}>
      <body className="antialiased bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
        {/* ── Siyah gazete header ── */}
        <header className="sticky top-0 z-50 shadow-xl bg-stone-950">
          {/* Üst ince bant */}
          <div className="border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between">
              <p className="text-[10px] text-stone-500 uppercase tracking-widest hidden sm:block">
                {now}
              </p>
              <p className="text-[10px] text-stone-500 italic hidden sm:block">
                Yapay zeka destekli haber analizi
              </p>
            </div>
          </div>

          {/* Logo + Nav */}
          <div className="px-4 mx-auto max-w-7xl sm:px-6">
            <div className="flex items-center justify-between gap-4 py-3">
              <Link href="/" className="shrink-0 group">
                <h1
                  className="text-2xl font-black leading-none tracking-tight text-white transition-opacity group-hover:opacity-90"
                  style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
                  Haber<span className="text-amber-400">AI</span>
                </h1>
                <p className="text-[9px] text-stone-500 uppercase tracking-widest mt-0.5">
                  Türkiye · Dünya · Analiz
                </p>
              </Link>

              <div className="relative flex items-center">
                <Navigation />
              </div>
            </div>
          </div>
        </header>

        {/* ── Sayfa içeriği ── */}
        <main>{children}</main>

        {/* ── Footer ── */}
        <footer className="mt-20 border-t bg-stone-950 border-stone-800">
          <div className="px-4 py-10 mx-auto max-w-7xl sm:px-6">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              {/* Logo */}
              <div>
                <p
                  className="text-xl font-black text-white"
                  style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
                  Haber<span className="text-amber-400">AI</span>
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  Yapay zeka destekli haber analizi
                </p>
              </div>

              {/* Linkler */}
              <div className="flex flex-wrap items-center gap-6 text-xs text-stone-500">
                <Link
                  href="/"
                  className="transition-colors hover:text-stone-300">
                  Anasayfa
                </Link>
                <Link
                  href="/summary"
                  className="transition-colors hover:text-stone-300">
                  Günün Özeti
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

              {/* Telif */}
              <p className="text-xs text-center text-stone-700 md:text-right">
                © {new Date().getFullYear()} HaberAI
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
