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
