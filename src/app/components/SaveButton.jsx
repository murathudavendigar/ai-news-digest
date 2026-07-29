"use client";

import { useState, useEffect } from "react";
import { isArticleSaved, saveArticle, unsaveArticle } from "@/app/lib/readingList";

export default function SaveButton({ article, showLabel = false }) {
  const [saved, setSaved] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (article?.slug) {
      Promise.resolve().then(() => setSaved(isArticleSaved(article.slug)));
    }
  }, [article?.slug]);

  const toggleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!article || !article.slug) return;

    const currentlySaved = isArticleSaved(article.slug);
    if (!currentlySaved) {
      saveArticle(article);
      setSaved(true);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    } else {
      unsaveArticle(article.slug);
      setSaved(false);
    }
  };

  if (!article || !article.slug) return null;

  return (
    <button
      type="button"
      onClick={toggleSave}
      aria-label={saved ? "Kaydedilenlerden çıkar" : "Haberi kaydet"}
      className={`
        flex items-center justify-center transition-colors
        ${
          showLabel
            ? "gap-1.5 px-3 py-1.5 border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
            : "w-8 h-8"
        }
        ${saved ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}
      `}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes savePop {
          0% { transform: scale(1) }
          50% { transform: scale(1.3) }
          100% { transform: scale(1) }
        }
        .animate-save-pop { animation: savePop 300ms ease-out forwards; }
      `}} />
      <span className={`flex items-center justify-center text-lg ${animating ? "animate-save-pop" : ""}`}>
        {saved ? "🔖" : "📑"}
      </span>
      {showLabel && (
        <span className="text-xs font-bold font-mono">
          {saved ? "Kaydedildi" : "Kaydet"}
        </span>
      )}
    </button>
  );
}
