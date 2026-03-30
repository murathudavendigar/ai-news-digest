"use client";

import { useState } from "react";
import ReaderBottomSheet from "./ReaderBottomSheet";

export default function ReaderTriggerCTA({ article }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 w-full py-4 px-6 mt-4
                   bg-stone-900 dark:bg-white text-white dark:text-stone-900
                   font-bold text-base rounded-xl
                   hover:bg-stone-800 dark:hover:bg-stone-100
                   transition-colors shadow-lg">
        Kaynağa Git
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </button>

      <ReaderBottomSheet
        article={article}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
