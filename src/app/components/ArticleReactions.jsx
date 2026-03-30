"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/app/lib/siteConfig";
import { REACTIONS, getReaction, setReaction } from "@/app/lib/reactionConfig";

export default function ArticleReactions({ articleSlug, categorySlug, compact = false }) {
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(null);

  useEffect(() => {
    if (articleSlug) {
      setSelected(getReaction(articleSlug));
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

  // Determine an accent color based on category if provided, otherwise default to a neutral stone.
  const categoryBgColorMap = {
    technology: "bg-blue-950/40 text-blue-400 border-blue-900/50",
    science: "bg-purple-950/40 text-purple-400 border-purple-900/50",
    sports: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50",
    business: "bg-lime-950/40 text-lime-400 border-lime-900/50",
    health: "bg-teal-950/40 text-teal-400 border-teal-900/50",
    entertainment: "bg-pink-950/40 text-pink-400 border-pink-900/50",
    culture: "bg-fuchsia-950/40 text-fuchsia-400 border-fuchsia-900/50",
    defense: "bg-slate-950/40 text-slate-400 border-slate-900/50",
    lifestyle: "bg-rose-950/40 text-rose-400 border-rose-900/50",
    politics: "bg-sky-950/40 text-sky-400 border-sky-900/50",
    world: "bg-indigo-950/40 text-indigo-400 border-indigo-900/50",
  };
  
  const selectedClass = categoryBgColorMap[categorySlug] || "bg-stone-800 text-stone-200 border-stone-600";

  if (compact) {
    const activeReaction = REACTIONS.find(r => r.id === selected);
    return (
      <div className="flex h-5 items-center justify-center rounded-bl-xl bg-stone-900/90 px-2 text-[10px] tabular-nums shadow-sm backdrop-blur-md relative overflow-hidden group">
        <span className="opacity-70 group-hover:opacity-100 transition-opacity">
          {activeReaction ? activeReaction.emoji : <span className="text-stone-500 font-bold">+</span>}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes reactionPop {
          0% { transform: scale(1) }
          40% { transform: scale(1.35) }
          70% { transform: scale(0.9) }
          100% { transform: scale(1) }
        }
        .animate-pop {
          animation: reactionPop 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}} />
      {REACTIONS.map((reaction) => {
        const isSelected = selected === reaction.id;
        const isDimmed = selected !== null && !isSelected;
        
        return (
          <button
            key={reaction.id}
            onClick={() => toggleReaction(reaction.id)}
            className={`
              flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200
              ${isSelected ? selectedClass : "bg-stone-900/50 text-stone-400 border-stone-800 hover:bg-stone-800"}
              ${isDimmed ? "opacity-35" : "opacity-100"}
              ${animating === reaction.id ? "animate-pop" : ""}
            `}
            aria-pressed={isSelected}
            aria-label={`${reaction.label} olarak reaksiyon ver`}
          >
            <span className="text-sm">{reaction.emoji}</span>
            <span>{reaction.label}</span>
          </button>
        );
      })}
    </div>
  );
}
