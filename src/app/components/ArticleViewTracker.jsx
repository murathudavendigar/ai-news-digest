"use client";

import { useEffect, useRef } from "react";

/**
 * ArticleViewTracker — Side-effect only component.
 * POSTs to the view API once on mount to increment view_count.
 * No UI rendered.
 */
export default function ArticleViewTracker({ columnistSlug, columnSlug }) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current || !columnistSlug || !columnSlug) return;
    hasFired.current = true;

    fetch(`/api/columns/${columnistSlug}/${columnSlug}/view`, {
      method: "POST",
    }).catch(() => {
      // Silent — view count is best-effort
    });
  }, [columnistSlug, columnSlug]);

  return null;
}
