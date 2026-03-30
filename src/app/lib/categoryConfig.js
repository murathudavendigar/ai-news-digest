export const TIERS = {
  DEEP: "deep",
  STANDARD: "standard",
  MINIMAL: "minimal",
};

// İngilizce kategori slug → Türkçe etiket
export const CATEGORY_LABELS = {
  politics: "Politika",
  business: "Ekonomi",
  crime: "Suç",
  world: "Dünya",
  defense: "Savunma",
  technology: "Teknoloji",
  science: "Bilim",
  health: "Sağlık",
  environment: "Çevre",
  education: "Eğitim",
  culture: "Kültür",
  sports: "Spor",
  entertainment: "Magazin",
  lifestyle: "Yaşam",
  food: "Yemek",
  tourism: "Turizm",
  other: "Diğer",
  top: "Öne Çıkanlar",
  domestic: "Gündem",
  breaking: "Son Dakika",
};

export const CATEGORY_TIER_MAP = {
  politics: TIERS.DEEP,
  business: TIERS.DEEP,
  crime: TIERS.DEEP,
  world: TIERS.DEEP,
  defense: TIERS.DEEP,
  technology: TIERS.STANDARD,
  science: TIERS.STANDARD,
  health: TIERS.STANDARD,
  environment: TIERS.STANDARD,
  education: TIERS.STANDARD,
  culture: TIERS.STANDARD,
  sports: TIERS.MINIMAL,
  entertainment: TIERS.MINIMAL,
  lifestyle: TIERS.MINIMAL,
  food: TIERS.MINIMAL,
  tourism: TIERS.MINIMAL,
  other: TIERS.MINIMAL,
  top: TIERS.STANDARD,
  domestic: TIERS.STANDARD,
  breaking: TIERS.STANDARD,
};

export const TIER_CONFIG = {
  [TIERS.DEEP]: {
    label: "Derin Analiz",
    maxTokensSummary: 2000, // analysis(4-6 cümle) + 5 keyPoints + actionableInsights Türkçe
    maxTokensScore: 1800, // artık analyzeArticle.js'de override ediliyor
    maxTokensContext: 4000, // artık analyzeArticle.js'de override ediliyor
    showScore: true,
    showContext: true,
    showComparison: true,
  },
  [TIERS.STANDARD]: {
    label: "Standart Analiz",
    maxTokensSummary: 1500,
    maxTokensScore: 1800,
    maxTokensContext: 2500,
    showScore: true,
    showContext: true,
    showComparison: true,
  },
  [TIERS.MINIMAL]: {
    label: "Özet",
    maxTokensSummary: 900, // kısa haber bile 500'de kesilebilir
    maxTokensScore: 0,
    maxTokensContext: 0,
    showScore: false,
    showContext: false,
    showComparison: false,
  },
};

// Bir haberin kategorisini → tier'ını döndürür
export function getTier(article) {
  const cats = article.category || [];
  // Birden fazla kategori varsa en yüksek tier'ı seç
  const tierPriority = [TIERS.DEEP, TIERS.STANDARD, TIERS.MINIMAL];
  for (const tier of tierPriority) {
    if (cats.some((c) => CATEGORY_TIER_MAP[c?.toLowerCase()] === tier)) {
      return tier;
    }
  }
  return TIERS.STANDARD; // bilinmeyen kategori → standard
}

export function getTierConfig(article) {
  const tier = getTier(article);
  return { tier, ...TIER_CONFIG[tier] };
}

/**
 * Bu kategorilerdeki haberler detay sayfasında "bağlam" bloğu göstermez.
 * (Piyasa verileri, siyasi bağlam vs. gereksiz.)
 */
export const CATEGORIES_WITHOUT_CONTEXT = [
  "sports",
  "health",
  "lifestyle",
  "culture",
  "entertainment",
  "science",
  "education",
  "food",
  "tourism",
];

/** Kategori → renk eşlemesi (Tailwind renk isimleri) */
export const CATEGORY_COLORS = {
  politics: "red",
  domestic: "red",
  breaking: "red",
  business: "amber",
  sports: "green",
  technology: "blue",
  science: "indigo",
  health: "teal",
  world: "purple",
  culture: "pink",
  entertainment: "pink",
  lifestyle: "orange",
  defense: "slate",
  crime: "rose",
  environment: "emerald",
  education: "cyan",
  food: "yellow",
  tourism: "sky",
  top: "amber",
  other: "stone",
};
