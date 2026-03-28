/**
 * columnistConfig.js
 * ─────────────────────────────────────────────────────────────
 * Köşe yazarı takvimi, gün hesaplama ve slug dönüştürme araçları.
 * Pattern: authorConfig / siteConfig / cityConfig (tek sorumluluk, named exports)
 * ─────────────────────────────────────────────────────────────
 */

// 0=Sunday, 1=Monday … 6=Saturday
export const COLUMNIST_SCHEDULE = {
  0: "burak-deniz", // Sunday
  1: "ceylan-arslan", // Monday
  2: "mert-yildiz", // Tuesday
  3: "derin-kaya", // Wednesday
  4: "ayse-tunc", // Thursday
  5: "can-erdem", // Friday
  6: "lale-sahin", // Saturday
};

/**
 * Bugünün yazarının slug'ını döndürür (Türkiye saatine göre).
 */
export const getTodaysColumnistSlug = () => {
  const now = new Date();
  // UTC+3 offset — her zaman Türkiye günü
  const turkeyDay = new Date(now.getTime() + 3 * 60 * 60 * 1000).getUTCDay();
  return COLUMNIST_SCHEDULE[turkeyDay];
};

/**
 * Bugünün yayın zamanını döndürür: 10:00 Türkiye = 07:00 UTC
 */
export const getTodayPublishTime = () => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7, 0, 0),
  );
};

/**
 * 7 gün öncesinin ISO string değerini döndürür.
 * (React Compiler'ın impure function uyarılarını aşmak için util haline getirildi)
 */
export const getSevenDaysAgoISO = () => {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
};

/**
 * Türkçe karakter dönüştürücü slug helper
 * ş→s, ı→i, ğ→g, ü→u, ö→o, ç→c
 */
export const toColumnSlug = (title, date) => {
  const dateStr = date.toISOString().split("T")[0];
  const slug = title
    .toLowerCase()
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug}-${dateStr}`;
};

// ─────────────────────────────────────────────────────────────
// Columnist Accent Colors — unique per author across all UI
// ─────────────────────────────────────────────────────────────
export const COLUMNIST_ACCENTS = {
  "ceylan-arslan": {
    primary: "#2E6DA4",
    light: "#EBF3FB",
    dark: "#1A4A75",
    label: "blue",
  },
  "mert-yildiz": {
    primary: "#D97706",
    light: "#FEF3C7",
    dark: "#92400E",
    label: "amber",
  },
  "derin-kaya": {
    primary: "#059669",
    light: "#D1FAE5",
    dark: "#064E3B",
    label: "emerald",
  },
  "ayse-tunc": {
    primary: "#DC2626",
    light: "#FEE2E2",
    dark: "#7F1D1D",
    label: "red",
  },
  "can-erdem": {
    primary: "#7C3AED",
    light: "#EDE9FE",
    dark: "#4C1D95",
    label: "purple",
  },
  "lale-sahin": {
    primary: "#DB2777",
    light: "#FCE7F3",
    dark: "#831843",
    label: "rose",
  },
  "burak-deniz": {
    primary: "#EA580C",
    light: "#FFEDD5",
    dark: "#7C2D12",
    label: "orange",
  },
};

export const getColumnistAccent = (slug) =>
  COLUMNIST_ACCENTS[slug] ?? {
    primary: "#6B7280",
    light: "#F3F4F6",
    dark: "#1F2937",
    label: "gray",
  };
