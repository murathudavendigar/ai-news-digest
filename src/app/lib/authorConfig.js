/**
 * Yazar / proje bilgileri
 * Buraya kendi bilgilerini ekle — about sayfasında otomatik görünür.
 */
export const author = {
  name: "Murat Hudavendigar Öncü",
  title: "Yazılım Geliştirici", // unvan / rol
  bio: "Teknoloji, yapay zeka ve medyanın kesiştiği noktalara meraklı bir geliştirici. HaberAI, haber tüketimini daha bilinçli ve verimli hale getirmek için başlattığım kişisel bir proje.", // kısa biyografi
  avatar: "https://avatars.githubusercontent.com/u/109613328?v=4", // /avatar.jpg gibi public/ altına koyabilirsin, boş bırakırsan baş harfler gösterilir
  email: "murathoncu@gmail.com", // iletişim e-postası (boşsa gösterilmez)
  links: {
    github: "https://github.com/murathudavendigar", // https://github.com/kullanici-adi
    linkedin: "https://www.linkedin.com/in/murathudavendigaroncu/", // https://linkedin.com/in/kullanici-adi
    twitter: "https://twitter.com/murathoncu", // https://twitter.com/kullanici-adi
    website: "https://murathudavendigar.vercel.app/", // kişisel site varsa
  },
};

export const projectInfo = {
  name: "HaberAI",
  tagline: "Yapay zeka destekli Türkçe haber analizi",
  description:
    "HaberAI; çeşitli kaynaklardan gelen haberleri toplayıp Gemini yapay zeka modeliyle özetleyen, karşılaştıran ve analiz eden bağımsız bir haber platformudur.",

  // ── Özellikler ──────────────────────────────────────────────────────────
  features: [
    {
      emoji: "📡",
      label: "RSS Agregasyonu",
      desc: "90+ Türk haber kaynağından gerçek zamanlı içerik",
    },
    {
      emoji: "🤖",
      label: "AI Analiz",
      desc: "Gemini ile otomatik özet, tema ve öngörü",
    },
    {
      emoji: "📰",
      label: "Günlük Özet",
      desc: "Her gün editöryal formatta derlenmiş bülten",
    },
    {
      emoji: "🔔",
      label: "Son Dakika Bildirimi",
      desc: "Anahtar kelime tabanlı push notification",
    },
    {
      emoji: "💹",
      label: "Piyasa Verileri",
      desc: "BIST, dolar, euro, altın, Bitcoin anlık takip",
    },
    {
      emoji: "🌤️",
      label: "Hava Durumu",
      desc: "İstanbul başta şehir bazlı günlük tahmin",
    },
    {
      emoji: "🔖",
      label: "Yer İmleri",
      desc: "Haberleri tarayıcıda kaydet, offline oku",
    },
    {
      emoji: "🌙",
      label: "Karanlık Mod",
      desc: "Sistem temasına uyumlu otomatik geçiş",
    },
  ],

  // ── İstatistikler ───────────────────────────────────────────────────────
  stats: [
    { label: "Haber Kaynağı", value: "90+" },
    { label: "Kategori", value: "10" },
    { label: "Yayın Günü", value: null }, // null → otomatik hesaplanır (launchYear'dan)
    { label: "Günlük Özet", value: "Her gün" },
  ],

  // ── Gizlilik ────────────────────────────────────────────────────────────
  privacy: {
    adsEnabled: false,
    analyticsEnabled: false, // true ise aşağıya hangi tool'u yazdır
    analyticsTool: "", // "Plausible", "Vercel Analytics" vb.
    dataCollected:
      "Yalnızca push bildirimi için tarayıcı abonelik anahtarı saklanır. Kişisel veri toplanmaz.",
    cookiesUsed: false,
  },

  // ── İletişim ────────────────────────────────────────────────────────────
  contact: {
    email: "murathoncu@gmail.com",
    formUrl: "", // Google Form, Tally vb. linki — boşsa gösterilmez
    note: "Kaynak önerileri, hata bildirimleri ve her türlü geri bildirim için yazabilirsiniz.",
  },

  // ── Tech stack ──────────────────────────────────────────────────────────
  techStack: [
    { label: "Next.js 16", desc: "App Router ile sunucu tabanlı render" },
    { label: "Tailwind CSS", desc: "Utility-first stil sistemi" },
    { label: "Gemini AI", desc: "Haber özeti ve analiz için LLM" },
    { label: "Upstash Redis", desc: "Edge-compatible önbellekleme" },
    { label: "Vercel", desc: "Deployment & Edge Functions" },
    { label: "Web Push", desc: "VAPID tabanlı push bildirimleri" },
  ],

  openSource: false,
  repoUrl: "",
  launchYear: 2026,
};