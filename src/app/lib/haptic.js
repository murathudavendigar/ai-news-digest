/**
 * Haptic feedback utility — Web Vibration API
 * Android Chrome destekler; iOS Safari desteklemez (sessizce geçer).
 */

function vibrate(pattern) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Sessiz fail
    }
  }
}

/** 10ms — navbar/link dokunuşu */
export const hapticLight = () => vibrate(10);

/** 30ms — genel buton */
export const hapticMedium = () => vibrate(30);

/** Çift darbe — yer imi eklendi */
export const hapticBookmarkAdd = () => vibrate([40, 30, 80]);

/** Tek kısa — yer imi kaldırıldı */
export const hapticBookmarkRemove = () => vibrate(25);

/** Uzun titreşim — önemli/uyarı aksiyon */
export const hapticStrong = () => vibrate([80, 40, 80]);
