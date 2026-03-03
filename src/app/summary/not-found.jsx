import Link from "next/link";

export default function SummaryNotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-white dark:bg-stone-950">
      <div className="max-w-md text-center">
        <p
          className="text-[7rem] font-black text-stone-200 dark:text-stone-800 leading-none select-none"
          style={{ fontFamily: "Georgia, serif" }}>
          404
        </p>
        <div className="h-0.5 w-16 bg-amber-400 mx-auto mb-5 -mt-2" />
        <h1
          className="mb-2 text-xl font-black text-stone-900 dark:text-stone-100"
          style={{ fontFamily: "Georgia, serif" }}>
          Baskı Bulunamadı
        </h1>
        <p className="mb-8 text-sm text-stone-500 dark:text-stone-400">
          Bu tarihe ait günün özeti mevcut değil.
        </p>
        <Link
          href="/summary"
          className="inline-block px-6 py-3 text-sm font-bold transition-opacity rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90">
          Bugünün Baskısına Git
        </Link>
      </div>
    </div>
  );
}
