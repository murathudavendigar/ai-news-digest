"use client";

import { useState, useEffect } from "react";

export default function ColumnReactions({ columnId, columnSlug, columnistSlug, initialCounts }) {
  const [counts, setCounts] = useState(
    initialCounts || { fire: 0, clap: 0, think: 0, heart: 0 },
  );
  const [reacting, setReacting] = useState(false);
  const [reactedType, setReactedType] = useState(null);

  useEffect(() => {
    // SSR-safe localStorage guard
    if (typeof window !== "undefined" && !localStorage.getItem("ai_news_session")) {
      localStorage.setItem("ai_news_session", crypto.randomUUID());
    }
  }, []);

  const handleReact = async (type) => {
    if (reacting || reactedType === type) return;

    setReacting(true);
    const previous = { ...counts };
    setCounts((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
    setReactedType(type);

    try {
      const sessionId =
        typeof window !== "undefined"
          ? localStorage.getItem("ai_news_session")
          : null;

      const res = await fetch(
        `/api/columns/${columnistSlug}/${columnSlug}/react`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reaction: type, sessionId }),
        },
      );
      const data = await res.json();
      if (data.counts) setCounts(data.counts);
    } catch {
      setCounts(previous);
      setReactedType(null);
    } finally {
      setReacting(false);
    }
  };

  const buttons = [
    { type: "fire", emoji: "🔥" },
    { type: "heart", emoji: "❤️" },
    { type: "clap", emoji: "👏" },
    { type: "think", emoji: "🤔" },
  ];

  return (
    <div className="flex flex-wrap gap-3 my-8 py-6 border-y border-stone-100 dark:border-stone-800">
      <span className="w-full text-sm font-semibold text-stone-500 dark:text-stone-400 mb-2">
        Yazıya Tepkiniz
      </span>
      {buttons.map((b) => (
        <button
          key={b.type}
          onClick={() => handleReact(b.type)}
          disabled={reacting || reactedType === b.type}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
            reactedType === b.type
              ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800"
              : "bg-white border-stone-200 hover:bg-stone-50 dark:bg-stone-800 dark:border-stone-700 dark:hover:bg-stone-700"
          }`}>
          <span className="text-xl">{b.emoji}</span>
          <span className="font-semibold">{counts[b.type] || 0}</span>
        </button>
      ))}
    </div>
  );
}
