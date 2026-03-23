"use client";
import { useState, useEffect } from "react";

export default function ReactionButtons({ columnId, initialCounts }) {
  const [counts, setCounts] = useState(initialCounts || { fire: 0, clap: 0, think: 0, heart: 0 });
  const [reacting, setReacting] = useState(false);
  const [reactedType, setReactedType] = useState(null);

  useEffect(() => {
    // Session state per device without login
    if (!localStorage.getItem("ai_news_session")) {
      localStorage.setItem("ai_news_session", crypto.randomUUID());
    }
  }, []);

  const handleReact = async (type) => {
    if (reacting || reactedType === type) return;
    
    setReacting(true);
    // Optimistic UI
    const previous = { ...counts };
    setCounts(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
    setReactedType(type);

    try {
      const sessionId = localStorage.getItem("ai_news_session");
      const res = await fetch("/api/columns/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId, reaction: type, sessionId })
      });
      const data = await res.json();
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err) {
      console.error(err);
      setCounts(previous);
      setReactedType(null);
    } finally {
      setReacting(false);
    }
  };

  const buttons = [
    { type: "fire", emoji: "🔥" },
    { type: "clap", emoji: "👏" },
    { type: "think", emoji: "🤔" },
    { type: "heart", emoji: "❤️" }
  ];

  return (
    <div className="flex flex-wrap gap-3 my-8 py-6 border-y border-gray-100 dark:border-gray-800">
      <span className="w-full text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Yazıya Tepkiniz</span>
      {buttons.map(b => (
        <button
          key={b.type}
          onClick={() => handleReact(b.type)}
          disabled={reacting || reactedType === b.type}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
            reactedType === b.type 
              ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800' 
              : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
          }`}
        >
          <span className="text-xl">{b.emoji}</span>
          <span className="font-semibold">{counts[b.type] || 0}</span>
        </button>
      ))}
    </div>
  );
}
