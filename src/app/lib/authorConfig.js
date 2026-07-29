/**
 * Yazar / proje bilgileri
 * Buraya kendi bilgilerini ekle — about sayfasında otomatik görünür.
 */
import { siteConfig } from "@/app/lib/siteConfig";

export const author = {
  name: "Murat Hudavendigar Öncü",
  title: "Kurucu · Yazılım Geliştirici",
  bio: "Teknoloji, yapay zeka ve medyanın kesiştiği noktalara meraklı bir geliştirici. HaberAI; haber tüketimini daha bilinçli, hızlı ve şeffaf hale getirmek için yürüttüğüm bağımsız bir proje.",
  avatar: "https://avatars.githubusercontent.com/u/109613328?v=4",
  email: "contact@muratoncu.com",
  links: {
    github: "https://github.com/murathudavendigar",
    linkedin: "https://www.linkedin.com/in/murathudavendigaroncu/",
    twitter: "https://twitter.com/murathoncu",
    website: "https://muratoncu.com/",
  },
};

export const projectInfo = {
  name: "HaberAI",
  tagline: "Yapay zeka destekli Türkçe haber analizi",
  description:
    "HaberAI; güvenilir yayınlardan RSS ile toplanan manşetleri tek akışta birleştirir. Kısa özet, güvenilirlik skoru, arka plan analizi, günlük bülten ve köşe yazıları yapay zeka ile üretilir — asıl haber her zaman kaynak yayına aittir.",
  /** Canonical site URL — siteConfig ile senkron */
  get siteUrl() {
    return siteConfig.url;
  },

  principles: [
    {
      title: "Kaynak önce",
      desc: "Her haberde orijinal yayına giden bağlantı vardır. Telif ve doğruluk sorumluluğu kaynağa aittir.",
    },
    {
      title: "AI şeffaf",
      desc: "Özet ve analiz yapay zeka ile üretilir; içerik bloklarında bu açıkça belirtilir. Uydurma iddia yerine bilinmeyen bırakılır.",
    },
    {
      title: "Reklamsız okuma",
      desc: "Bağımsız, reklamsız bir deneyim. Kişisel veri avı yok; push için yalnızca abonelik anahtarı tutulur.",
    },
    {
      title: "Editöryal ritim",
      desc: "Günlük özet, köşe yazarı takvimi ve bildirimler düzenli bir gazete ritminde çalışır.",
    },
  ],

  methodology: [
    {
      title: "Toplama",
      desc: "90+ kaynaktan RSS; bozuk kaynaklar sağlık taramasıyla geçici olarak devre dışı bırakılır.",
    },
    {
      title: "Özet & skor",
      desc: "Okuma süresi için kısa özet; güvenilirlik / tarafsızlık alt skorları AI ile üretilir.",
    },
    {
      title: "Derinlik",
      desc: "İstek üzerine arka plan analizi; senaryolar spekülasyon olarak işaretlenir.",
    },
    {
      title: "Günlük gazete",
      desc: "Her sabah özet üretilir; akşam bildirimi ile /digest sayfasına yönlendirilir.",
    },
    {
      title: "Köşe",
      desc: "Yedi kişilik yazar takvimi; konu seçimi uzmanlığa göre yapılır, persona sistem prompt ile uygulanır.",
    },
  ],

  features: [
    {
      label: "RSS agregasyonu",
      desc: "Türkiye ve dünya masalarından tek akış",
    },
    {
      label: "AI özet & analiz",
      desc: "Kısa okuma, skor ve arka plan",
    },
    {
      label: "Günlük özet",
      desc: "Editöryal bülten · her gün",
    },
    {
      label: "Köşe yazarları",
      desc: "Güne özel ses ve bakış açısı",
    },
    {
      label: "Push bildirimleri",
      desc: "Günün özeti ve son dakika",
    },
    {
      label: "PWA",
      desc: "Ana ekrana ekle, çevrimdışı iskelet",
    },
    {
      label: "Kaydet & geçmiş",
      desc: "Okuma listesi tarayıcıda",
    },
    {
      label: "Piyasa & hava",
      desc: "BIST, döviz, altın ve şehir tahmini",
    },
  ],

  stats: [
    { label: "Haber kaynağı", value: "90+" },
    { label: "Kategori", value: "11" },
    { label: "Yayın günü", value: null },
    { label: "Köşe yazarı", value: "7" },
  ],

  privacy: {
    adsEnabled: false,
    analyticsEnabled: false,
    analyticsTool: "",
    dataCollected:
      "Push bildirimi için tarayıcı abonelik anahtarı (endpoint) saklanır. Hesap zorunlu değildir; okuma geçmişi ve kayıtlar cihazınızda tutulur. Kişisel profil satılmaz.",
    cookiesUsed: false,
  },

  contact: {
    email: "contact@muratoncu.com",
    formUrl: "",
    note: "Kaynak önerisi, hata bildirimi ve geri bildirim için yazın. Yanıtlamaya çalışırım.",
  },

  techStack: [
    { label: "Next.js", desc: "App Router · sunucu render" },
    { label: "Tailwind CSS", desc: "Tasarım token’ları ile UI" },
    { label: "Gemini + multi-LLM", desc: "Özet, analiz, köşe" },
    { label: "Upstash Redis", desc: "Feed ve AI önbelleği" },
    { label: "Supabase", desc: "Köşe ve digest depolama" },
    { label: "Vercel", desc: "Deploy · günlük cron" },
  ],

  openSource: false,
  repoUrl: "",
  launchYear: 2026,
};
