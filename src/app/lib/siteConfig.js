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
  version: "0.1.0",

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
  url:
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://ai-news-digest-fawn.vercel.app",

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
