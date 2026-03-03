/**
 * siteConfig.js
 * ─────────────────────────────────────────────────────────────
 * Uygulamanın tüm sabit bilgileri bu dosyada tutulur.
 * İsim, versiyon, açıklama vb. güncellemek için sadece bu
 * dosyayı düzenlemek yeterlidir — rest of the app otomatik güncellenir.
 * ─────────────────────────────────────────────────────────────
 */

export const siteConfig = {
  /** Görünen uygulama adı */
  name: "HaberAI",

  /** Logo birinci parça (renksiz) */
  logoPrimary: "Haber",

  /** Logo vurgu parça (sarı/amber) */
  logoAccent: "AI",

  /** Kısa etiket (tab başlığı template'inde kullanılır) */
  nameShort: "HaberAI",

  /** Versiyon — package.json ile senkronize tutun */
  version: "1.7.7",

  /** Ana slogan */
  tagline: "Yapay Zeka Destekli Haber Analizi",

  /** Header altında görünen alt başlık */
  subtitle: "Türkiye · Dünya · Analiz",

  /** OG / Twitter card + meta description için uzun açıklama */
  description:
    "Türkiye ve dünyadan en güncel haberler — AI destekli güvenilirlik ve derinlik analizi ile.",

  /** Homepage meta description */
  descriptionHome:
    "Türkiye ve dünyadan en güncel son dakika haberleri — yapay zeka ile güvenilirlik analizi.",

  /** Canonical domain — env'den okunur, yoksa fallback */
  url: process.env.NEXT_PUBLIC_BASE_URL || "https://haberaii.vercel.app",

  /** Default OG görseli (Next.js opengraph-image route) */
  ogImage: "/opengraph-image",

  /** HTML `lang` attribute */
  lang: "tr",

  /** OG locale */
  locale: "tr_TR",

  /** Footer ve paylaşım metinleri için kısa tanıtım */
  creditLine: `© ${new Date().getFullYear()} HaberAI`,

  /** İletişim e-postası (footer vs.) */
  contactEmail: "",

  /** SEO anahtar kelimeler */
  keywords: [
    "haber",
    "yapay zeka",
    "AI haber",
    "güvenilirlik analizi",
    "Türkiye haberleri",
    "dünya haberleri",
    "son dakika",
  ],
};

/**
 * Uygulama genelinde kullanılan kategori listesi.
 * Navigation, Settings ve diğer bileşenler buradan import eder.
 */
export const CATEGORIES = [
  { slug: "technology", title: "Teknoloji", icon: "💻" },
  { slug: "science", title: "Bilim", icon: "🔬" },
  { slug: "sports", title: "Spor", icon: "⚽" },
  { slug: "business", title: "Ekonomi", icon: "📈" },
  { slug: "health", title: "Sağlık", icon: "🏥" },
  { slug: "entertainment", title: "Magazin", icon: "🎦" },
  { slug: "culture", title: "Kültür", icon: "🎨" },
  { slug: "defense", title: "Savunma", icon: "🛡️" },
  { slug: "lifestyle", title: "Yaşam", icon: "🌿" },
  { slug: "politics", title: "Politika", icon: "🏙️" },
  { slug: "world", title: "Dünya", icon: "🌍" },
];

/**
 * Cron zamanlamaları — vercel.json ile senkronize tutun.
 * Değiştirilecekse sadece bu dosyayı düzenlemek yeterlidir.
 */
export const CRON = {
  /** Push bildirimi UTC saati (vercel.json: "0 17 * * *") */
  PUSH_NOTIFY_UTC_HOUR: 17,

  /** Günlük özet üretim UTC saati (vercel.json: "0 4 * * *") */
  DAILY_SUMMARY_UTC_HOUR: 4,
};

/**
 * Verilen UTC saatini kullanıcının yerel saat dilimine çevirir.
 * Tarayıcı Intl API'si yoksa UTC saatini döndürür.
 *
 * @param {number} utcHour  - 0-23 arası UTC saati
 * @param {string} [locale] - BCP 47 locale, örn. "tr-TR". Varsayılan: tarayıcı locale'i.
 * @returns {string}  örn. "20:00"
 */
export function formatCronTimeLocal(utcHour, locale) {
  try {
    const date = new Date();
    date.setUTCHours(utcHour, 0, 0, 0);
    return date.toLocaleTimeString(locale ?? undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return `${String(utcHour).padStart(2, "0")}:00 UTC`;
  }
}
