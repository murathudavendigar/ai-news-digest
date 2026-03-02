/**
 * Haber kaynağı güvenilirlik değerlendirmesi.
 * Kaynak adı normalize edilip bu haritayla eşleştirilir.
 * Sadece belirgin uç noktalar badge gösterir (çoğu kaynak "nötr" kalır).
 *
 * tier:
 *  "high"    → 🟢 Yerleşik / haber ajansı — yüksek editoryal standart
 *  "medium"  → (badge yok) — genel medya, makul standart
 *  "low"     → 🔴 Kaynağı doğrulayın — tabloid / abartılı içerik
 */

const SOURCE_MAP = {
  // ── Haber ajansları (daima yüksek) ──────────────────────────────────
  reuters: "high",
  "reuters türkiye": "high",
  "reuters news": "high",
  "associated press": "high",
  ap: "high",
  "ap news": "high",
  afp: "high",
  "agence france-presse": "high",
  bloomberg: "high",
  "bloomberg ht": "high",
  "bloomberg news": "high",

  // ── Uluslararası yerleşik medya ──────────────────────────────────────
  bbc: "high",
  "bbc news": "high",
  "bbc türkçe": "high",
  "the guardian": "high",
  guardian: "high",
  "financial times": "high",
  "the economist": "high",
  "die welt": "high",
  "der spiegel": "high",
  "le monde": "high",
  dw: "high",
  "dw türkçe": "high",
  "deutsche welle": "high",
  "al jazeera": "high",
  "al jazeera türk": "high",
  "the new york times": "high",
  nyt: "high",
  "the washington post": "high",
  washingtonpost: "high",
  "wall street journal": "high",
  wsj: "high",
  "the independent": "high",
  nature: "high",
  science: "high",
  "national geographic": "high",
  politico: "high",
  axios: "high",
  "the atlantic": "high",
  "foreign affairs": "high",

  // ── Türk medyası (yerleşik) ──────────────────────────────────────────
  "trt haber": "high",
  "trt world": "high",
  "anadolu ajansı": "high",
  aa: "high",
  ntv: "high",
  "cnn türk": "high",
  "cnn international": "high",
  milliyet: "medium",
  hürriyet: "medium",
  sozcu: "medium",
  sözcü: "medium",
  cumhuriyet: "medium",
  sabah: "medium",
  haberturk: "medium",
  habertürk: "medium",
  bianet: "medium",
  t24: "medium",
  "gazete duvar": "medium",
  "krt haber": "medium",
  "star gazetesi": "medium",
  "karar gazetesi": "medium",
  "dünya gazetesi": "medium",

  // ── Tabloid / sensasyonel ────────────────────────────────────────────
  "daily mail": "low",
  "the sun": "low",
  "daily star": "low",
  "the mirror": "low",
  "new york post": "low",
  "national enquirer": "low",
  tmz: "low",
  buzzfeed: "low",
};

/**
 * source_name'i normalize ederek güvenilirlik tier'ını döndürür.
 * @param {string} sourceName — makaledeki ham kaynak adı
 * @returns {"high"|"medium"|"low"|null}
 */
export function getSourceTier(sourceName) {
  if (!sourceName) return null;
  const key = sourceName.toLowerCase().trim();
  return SOURCE_MAP[key] ?? null;
}

/** Görsel konfigürasyonu */
export const CREDIBILITY_CONFIG = {
  high: {
    label: "Doğrulanmış kaynak",
    badge: "🟢",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  },
  low: {
    label: "Kaynağı doğrulayın",
    badge: "🔴",
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
  },
};
