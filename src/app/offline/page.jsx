import Link from "next/link";
import RetryButton from "./RetryButton";

export const metadata = {
  title: "Çevrimdışı — HaberAI",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl mb-6">📡</p>
      <h1
        className="text-3xl font-black text-stone-900 dark:text-stone-50 mb-3"
        style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
        Çevrimdışısınız
      </h1>
      <p className="text-stone-500 dark:text-stone-400 max-w-sm mb-8 text-sm leading-relaxed">
        İnternet bağlantınız yok. Önbellekteki sayfalar yüklenebildiği kadar
        gösterilir.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <RetryButton />
        <Link
          href="/"
          className="px-5 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
          Ana Sayfa
        </Link>
      </div>
    </div>
  );
}
