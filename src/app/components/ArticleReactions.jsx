"use client";

import { useEffect, useState } from "react";
import { REACTIONS, getReaction, setReaction } from "@/app/lib/reactionConfig";

export default function ArticleReactions({
  articleSlug,
  categorySlug,
  compact = false,
}) {
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(null);

  useEffect(() => {
    if (articleSlug) {
      Promise.resolve().then(() => setSelected(getReaction(articleSlug)));
    }
  }, [articleSlug]);

  const toggleReaction = (id) => {
    if (!articleSlug) return;

    const newReaction = selected === id ? null : id;
    setSelected(newReaction);
    setReaction(articleSlug, newReaction);

    if (newReaction) {
      setAnimating(newReaction);
      setTimeout(() => setAnimating(null), 300);
    }
  };

  if (!articleSlug) return null;

  const selectedClass =
    "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--accent-brand)]";

  if (compact) {
    const activeReaction = REACTIONS.find((r) => r.id === selected);
    return (
      <div className="flex h-5 items-center justify-center px-2 text-[10px] tabular-nums relative overflow-hidden group bg-[var(--bg-elevated)]/90 text-[var(--text-secondary)]">
        <span className="opacity-70 group-hover:opacity-100 transition-opacity">
          {activeReaction ? (
            activeReaction.emoji
          ) : (
            <span className="font-bold text-[var(--text-muted)]">+</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes reactionPop {
          0% { transform: scale(1) }
          40% { transform: scale(1.35) }
          70% { transform: scale(0.9) }
          100% { transform: scale(1) }
        }
        .animate-pop {
          animation: reactionPop 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `,
        }}
      />
      {REACTIONS.map((reaction) => {
        const isSelected = selected === reaction.id;
        const isDimmed = selected !== null && !isSelected;

        return (
          <button
            key={reaction.id}
            type="button"
            onClick={() => toggleReaction(reaction.id)}
            className={`
              flex flex-1 min-w-[4.5rem] items-center justify-center gap-1.5 border px-3 py-2 text-xs font-semibold transition-all duration-200
              ${
                isSelected
                  ? selectedClass
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              }
              ${isDimmed ? "opacity-40" : "opacity-100"}
              ${animating === reaction.id ? "animate-pop" : ""}
            `}
            aria-pressed={isSelected}
            aria-label={`${reaction.label} olarak reaksiyon ver`}
            data-category={categorySlug || undefined}
          >
            <span className="text-sm">{reaction.emoji}</span>
            <span>{reaction.label}</span>
          </button>
        );
      })}
    </div>
  );
}
