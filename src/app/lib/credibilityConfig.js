/**
 * Credibility label configuration — compact badge system.
 * Replaces verbose analysis with simple inline labels.
 */

export const CREDIBILITY_LABELS = {
  verified: {
    label: "Doğrulandı",
    icon: "✓",
    description: "Birden fazla kaynakta teyit edildi",
    borderColor: "border-emerald-400 dark:border-emerald-600",
    textColor: "text-emerald-600 dark:text-emerald-400",
    bgHover: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
  },
  biased: {
    label: "Taraflı",
    icon: "⚡",
    description: "Belirgin bir bakış açısı içeriyor",
    borderColor: "border-amber-400 dark:border-amber-600",
    textColor: "text-amber-600 dark:text-amber-400",
    bgHover: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
  },
  caution: {
    label: "Dikkat",
    icon: "!",
    description: "Doğrulanmamış iddialar içerebilir",
    borderColor: "border-red-400 dark:border-red-600",
    textColor: "text-red-600 dark:text-red-400",
    bgHover: "hover:bg-red-50 dark:hover:bg-red-950/30",
  },
};
