import ConditionalFooter from "@/app/components/ConditionalFooter";
import Navigation from "@/app/components/Navigation";
import OfflineBanner from "@/app/components/OfflineBanner";
import PWAInstallPrompt from "@/app/components/PWAInstallPrompt";
import SearchBar from "@/app/components/SearchBar";
import ServiceWorkerRegistration from "@/app/components/ServiceWorkerRegistration";
import ThemeProvider from "@/app/components/ThemeProvider";
import { siteConfig } from "@/app/lib/siteConfig";
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

const {
  url: SITE_URL,
  name,
  nameShort,
  tagline,
  description,
  ogImage,
  locale,
  logoPrimary,
  logoAccent,
  subtitle,
} = siteConfig;

export const viewport = {
  themeColor: "#1c1917",
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${name} — ${tagline}`,
    template: `%s — ${nameShort}`,
  },
  description,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: name,
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale,
    url: SITE_URL,
    siteName: name,
    title: `${name} — ${tagline}`,
    description,
    images: [{ url: ogImage, width: 1200, height: 630, alt: name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${name} — ${tagline}`,
    description,
    images: [ogImage],
  },
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
            className="sticky top-0 z-50 shadow-xl bg-white dark:bg-stone-950 shadow-stone-200/50 dark:shadow-stone-950"
            style={{ "--header-height": "88px" }}>
            {/* Üst ince bant */}
            <div className="border-b border-stone-100 dark:border-white/10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between">
                <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-widest hidden sm:block">
                  {now}
                </p>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 italic hidden sm:block">
                  Yapay zeka destekli haber analizi
                </p>
              </div>
            </div>

            {/* Logo + Nav + Araçlar */}
            <div className="px-4 mx-auto max-w-7xl sm:px-6">
              <div className="flex items-center justify-between gap-4 py-3">
                {/* Logo */}
                <Link
                  href="/"
                  className="shrink-0 group"
                  aria-label={`${name} — Ana Sayfa`}>
                  <p
                    className="text-2xl font-black leading-none tracking-tight text-stone-900 dark:text-white transition-opacity group-hover:opacity-90"
                    style={{
                      fontFamily: "var(--font-display), Georgia, serif",
                    }}>
                    {logoPrimary}
                    <span className="text-amber-400">{logoAccent}</span>
                  </p>
                  <p className="text-[9px] text-stone-500 uppercase tracking-widest mt-0.5">
                    {subtitle}
                  </p>
                </Link>

                {/* Nav */}
                <div className="relative flex items-center justify-end flex-1 gap-1">
                  <Navigation />

                  {/* Sağ araç çubuğu */}
                  <div className="flex items-center gap-1 pl-2 ml-2 border-l border-stone-200 dark:border-white/10">
                    <SearchBar />

                    {/* Kaydedilenler */}
                    <Link
                      href="/saved"
                      title="Kaydedilenler"
                      className="flex items-center justify-center w-8 h-8 transition-all rounded-lg text-stone-400 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-white/10">
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

                    {/* Ayarlar */}
                    <Link
                      href="/settings"
                      title="Ayarlar"
                      className="flex items-center justify-center w-8 h-8 transition-all rounded-lg text-stone-400 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-white/10">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* ── İçerik ── */}
          <main className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </main>

          {/* ── Footer ── */}
          <ConditionalFooter />

          {/* ── PWA Install Prompt ── */}
          <PWAInstallPrompt />

          {/* ── Offline Banner ── */}
          <OfflineBanner />

          {/* ── Service Worker ── */}
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
