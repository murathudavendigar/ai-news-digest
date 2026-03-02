"use client";

export default function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="px-5 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
      Tekrar Dene
    </button>
  );
}
