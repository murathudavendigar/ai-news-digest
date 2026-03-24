"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "haberai_followed_columnists";

function getFollowed() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setFollowed(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

/**
 * FollowColumnistButton — Toggle follow state for a columnist.
 * Persists in localStorage (SSR-safe). Requests notification permission on follow.
 * Fires an anonymous follow/unfollow event to /api/columns/follow for analytics.
 */
export default function FollowColumnistButton({
  columnistSlug,
  columnistName,
  accentColor = "#6B7280",
  compact = false,
}) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setIsFollowing(getFollowed().includes(columnistSlug));
  }, [columnistSlug]);

  const handleToggle = useCallback(() => {
    const current = getFollowed();
    const willFollow = !current.includes(columnistSlug);
    const next = willFollow
      ? [...current, columnistSlug]
      : current.filter((s) => s !== columnistSlug);

    setFollowed(next);
    setIsFollowing(willFollow);

    // Animate
    setAnimate(true);
    setTimeout(() => setAnimate(false), 300);

    // Request notification permission on follow
    if (willFollow && typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Fire analytics (fire-and-forget)
    fetch("/api/columns/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        columnist_slug: columnistSlug,
        action: willFollow ? "follow" : "unfollow",
      }),
    }).catch(() => {});
  }, [columnistSlug]);

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
        style={{
          backgroundColor: isFollowing ? accentColor : "transparent",
          color: isFollowing ? "#fff" : accentColor,
          border: `1.5px solid ${accentColor}`,
          transform: animate ? "scale(1.1)" : "scale(1)",
        }}>
        {isFollowing ? "✓" : "🔔"} {isFollowing ? "Takip" : "Takip Et"}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
      style={{
        backgroundColor: isFollowing ? accentColor : "transparent",
        color: isFollowing ? "#fff" : accentColor,
        border: `2px solid ${accentColor}`,
        transform: animate ? "scale(1.05)" : "scale(1)",
      }}>
      {isFollowing ? "🔔 Takip Ediliyor ✓" : "🔔 Takip Et"}
    </button>
  );
}
