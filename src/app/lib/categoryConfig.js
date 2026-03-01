
export const TIERS = {
  DEEP: "deep",
  STANDARD: "standard",
  MINIMAL: "minimal",
};

export const CATEGORY_TIER_MAP = {
  politics: TIERS.DEEP,
  business: TIERS.DEEP,
  crime: TIERS.DEEP,
  world: TIERS.DEEP,
  technology: TIERS.STANDARD,
  science: TIERS.STANDARD,
  health: TIERS.STANDARD,
  environment: TIERS.STANDARD,
  education: TIERS.STANDARD,
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
    maxTokensSummary: 1200,
    maxTokensScore: 1000,
    maxTokensContext: 2048,
    showScore: true,
    showContext: true,
    showComparison: true,
  },
  [TIERS.STANDARD]: {
    label: "Standart Analiz",
    maxTokensSummary: 800,
    maxTokensScore: 700,
    maxTokensContext: 1200,
    showScore: true,
    showContext: true,
    showComparison: true,
  },
  [TIERS.MINIMAL]: {
    label: "Özet",
    maxTokensSummary: 500,
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
