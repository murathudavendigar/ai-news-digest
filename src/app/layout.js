import ConditionalFooter from "@/app/components/ConditionalFooter";
import Navigation from "@/app/components/Navigation";
import SearchBar from "@/app/components/SearchBar";
import ThemeProvider from "@/app/components/ThemeProvider";
import { Playfair_Display, Source_Serif_4 } from "next/font/google";
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
    <html
      lang="tr"
      className={`${playfair.variable} ${sourceSerif.variable}`}
      suppressHydrationWarning>
      <body className="antialiased bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
        <ThemeProvider>
          {/* ── Header ── */}
          <header
            className="sticky top-0 z-50 shadow-xl bg-stone-950"
            style={{ "--header-height": "88px" }}>
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

            {/* Logo + Nav + Araçlar */}
            <div className="px-4 mx-auto max-w-7xl sm:px-6">
              <div className="flex items-center justify-between gap-4 py-3">
                {/* Logo */}
                <Link href="/" className="shrink-0 group">
                  <h1
                    className="text-2xl font-black leading-none tracking-tight text-white transition-opacity group-hover:opacity-90"
                    style={{
                      fontFamily: "var(--font-display), Georgia, serif",
                    }}>
                    Haber<span className="text-amber-400">AI</span>
                  </h1>
                  <p className="text-[9px] text-stone-500 uppercase tracking-widest mt-0.5">
                    Türkiye · Dünya · Analiz
                  </p>
                </Link>

                {/* Nav */}
                <div className="relative flex items-center justify-end flex-1 gap-1">
                  <Navigation />

                  {/* Sağ araç çubuğu */}
                  <div className="flex items-center gap-1 pl-2 ml-2 border-l border-white/10">
                    <SearchBar />

                    {/* Kaydedilenler */}
                    <Link
                      href="/saved"
                      title="Kaydedilenler"
                      className="flex items-center justify-center w-8 h-8 transition-all rounded-lg text-stone-400 hover:text-amber-400 hover:bg-white/10">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </Link>

                    {/* <ThemeToggle /> */}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* ── İçerik ── */}
          <main>{children}</main>

          {/* ── Footer ── */}
          <ConditionalFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
