export function getCategoryStats() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('haberai_category_stats') || '{}');
  } catch { return {}; }
}

export function incrementCategoryRead(category, secondsSpent = 0) {
  if (typeof window === 'undefined' || !category) return;
  const catStr = Array.isArray(category) ? category[0] : category;
  if (!catStr) return;
  const stats = getCategoryStats();
  const current = stats[catStr] || { totalReads: 0, totalSeconds: 0 };
  stats[catStr] = {
    totalReads: current.totalReads + 1,
    totalSeconds: current.totalSeconds + secondsSpent,
    lastReadAt: new Date().toISOString(),
  };
  localStorage.setItem('haberai_category_stats', JSON.stringify(stats));
}

export function getTopCategories(limit = 3) {
  const stats = getCategoryStats();
  return Object.entries(stats)
    .sort((a, b) => b[1].totalReads - a[1].totalReads)
    .slice(0, limit)
    .map(([category, data]) => ({ category, ...data }));
}

export function getPersonalizedCategoryOrder() {
  const stats = getCategoryStats();
  if (Object.keys(stats).length < 3) return null; // not enough data yet
  return Object.entries(stats)
    .sort((a, b) => b[1].totalReads - a[1].totalReads)
    .map(([category]) => category);
}
