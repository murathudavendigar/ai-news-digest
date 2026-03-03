"use client";

import { hapticBookmarkAdd, hapticBookmarkRemove } from "@/app/lib/haptic";
import { useBookmarks } from "@/app/lib/useBookmarks";

export default function BookmarkButton({
  article,
  className = "",
  size = "sm",
}) {
  const { toggle, isBookmarked, mounted } = useBookmarks();
  if (!mounted) return null;

  const saved = isBookmarked(article.article_id);
  const sz = size === "lg" ? "w-5 h-5" : "w-4 h-4";

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (saved) hapticBookmarkRemove();
        else hapticBookmarkAdd();
        toggle(article);
      }}
      title={saved ? "Kaydedilenlerden çıkar" : "Kaydet"}
      className={`flex items-center justify-center transition-all duration-200 ${
        saved
          ? "text-amber-400 hover:text-amber-300"
          : "text-stone-400 hover:text-amber-400"
      } ${className}`}>
      <svg
        className={sz}
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
    </button>
  );
}
