import Navigation from "@/app/components/Navigation";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Haber Portalı - Son Dakika Haberler",
  description: "Türkiye ve dünyadan en güncel haberler",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-3xl">📰</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  Haber<span className="text-primary-600">Portalı</span>
                </span>
              </Link>

              <Navigation />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white mt-20">
          <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Haber Portalı.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
