"use client";

import { CREDIBILITY_LABELS } from "@/app/lib/credibilityConfig";
import { getCredibilityLabel } from "@/app/lib/sourceCredibility";
import { useState } from "react";

/**
 * Small inline credibility pill badge with tooltip.
 * Usage: <CredibilityBadge sourceName="Reuters" />
 */
export default function CredibilityBadge({ sourceName, className = "" }) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!sourceName) return null;

  const labelKey = getCredibilityLabel(sourceName);
  const cfg = CREDIBILITY_LABELS[labelKey];
  if (!cfg) return null;

  return (
    <span
      className={`relative inline-flex items-center gap-0.5 px-1.5 py-0.5
                  text-[10px] font-bold rounded-full border cursor-default
                  transition-colors select-none
                  ${cfg.borderColor} ${cfg.textColor} ${cfg.bgHover} ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
        e.stopPropagation();
        setShowTooltip((p) => !p);
      }}
      role="status"
      aria-label={cfg.description}
    >
      <span className="font-black leading-none">{cfg.icon}</span>
      <span className="hidden sm:inline">{cfg.label}</span>

      {/* Tooltip */}
      {showTooltip && (
        <span
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-1.5
                     whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-medium
                     bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-lg
                     pointer-events-none"
        >
          {cfg.description}
          <span
            className="absolute left-1/2 -translate-x-1/2 top-full
                       border-4 border-transparent border-t-stone-900 dark:border-t-stone-100"
          />
        </span>
      )}
    </span>
  );
}
