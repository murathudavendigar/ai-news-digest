"use client";

import { trackRead } from "@/app/hooks/useReadingHistory";
import { useEffect } from "react";

// Montaja girince okunmuş kategorileri localStorage'a yazar — görsel çıktısı yok
export default function ReadHistoryTracker({ categories = [] }) {
  useEffect(() => {
    if (categories?.length) trackRead(categories);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
