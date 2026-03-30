"use client";

import { useReadingTracker } from "@/app/hooks/useReadingTracker";

export default function ArticleTracker({ article }) {
  useReadingTracker(article);
  return null;
}
