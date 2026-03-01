
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        {/* Büyük numara */}
        <p
          className="text-[9rem] font-black leading-none text-stone-100 dark:text-stone-800 select-none"
          style={{ fontFamily: "Georgia, serif" }}>
          404
        </p>

        <div className="-mt-4">
          <div className="h-0.5 w-16 bg-amber-400 mx-auto mb-5" />
          <h1
            className="mb-2 text-2xl font-black text-stone-900 dark:text-stone-100"
            style={{ fontFamily: "Georgia, serif" }}>
            Sayfa Bulunamadı
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            Aradığınız sayfa kaldırılmış, taşınmış ya da hiç var olmamış
            olabilir.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900
                         text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
              Ana Sayfaya Dön
            </Link>
            <Link
              href="/summary"
              className="px-5 py-2.5 border border-stone-300 dark:border-stone-600
                         text-sm font-bold text-stone-700 dark:text-stone-300 rounded-lg
                         hover:border-stone-500 dark:hover:border-stone-400 transition-colors">
              Günün Özeti
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
