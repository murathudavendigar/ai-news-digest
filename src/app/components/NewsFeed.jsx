"use client";

import { usePullToRefresh } from "@/app/hooks/usePullToRefresh";
import { sortByHistory } from "@/app/hooks/useReadingHistory";
import {
  sortByFollowedTopics,
  sortByPreferredCategories,
} from "@/app/lib/useUserPreferences";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NewsCard from "./NewsCard";
import NewsCardSkeleton from "./NewsCardSkeleton";

const TIME_FILTERS = [
  { key: "all", label: "Tümü" },
  { key: "1h", label: "Son 1 Saat" },
  { key: "today", label: "Bugün" },
  { key: "week", label: "Bu Hafta" },
];

function articleAge(pubDate) {
  if (!pubDate) return Infinity;
  const d = new Date(pubDate);
  if (isNaN(d)) return Infinity;
  return Date.now() - d.getTime();
}

function articleMatchesPrefs(article, followedTopics, preferredCategories) {
  // Konu eşleşmesi (başlık + açıklama)
  const lower = followedTopics.map((t) => t.toLowerCase());
  const topicMatch =
    lower.length > 0 &&
    lower.some(
      (t) =>
        article.title?.toLowerCase().includes(t) ||
        article.description?.toLowerCase().includes(t),
    );
  // Kategori eşleşmesi — büyük/küçük harf bağımsız
  const lowerCats = preferredCategories.map((c) => c.toLowerCase());
  const catMatch =
    lowerCats.length > 0 &&
    article.category?.some((c) => lowerCats.includes(c?.toLowerCase()));
  return topicMatch || catMatch;
}

function TimeFilterBar({ timeFilter, setTimeFilter, count }) {
  return (
    <div className="-mx-4 px-4 md:mx-0 md:px-0 mb-5">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide md:flex-wrap">
        {TIME_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setTimeFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              timeFilter === f.key
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
            }`}>
            {f.label}
          </button>
        ))}
        {count != null && (
          <span className="ml-auto shrink-0 text-xs text-stone-400 dark:text-stone-500 pl-2">
            {count} haber
          </span>
        )}
      </div>
    </div>
  );
}

function SectionDivider({ label, count }) {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800" />
      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500 whitespace-nowrap">
        {label}
        {count != null && <span className="ml-1.5 opacity-60">{count}</span>}
      </span>
      <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800" />
    </div>
  );
}

export default function NewsFeed({
  initialArticles,
  initialNextPage,
  showTabs = true,
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [nextPage, setNextPage] = useState(initialNextPage);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(!initialNextPage);
  const [timeFilter, setTimeFilter] = useState("all");
  // Kullanıcı tercihleri — client mount sonrası yüklenir
  const [prefs, setPrefs] = useState({
    followedTopics: [],
    preferredCategories: [],
  });
  // Aktif sekme: "forYou" | "gundem"
  const [activeTab, setActiveTab] = useState("gundem");
  const touchStartX = useRef(null);

  const { pullY, refreshing, threshold } = usePullToRefresh();

  // Zaman filtresine göre görünen makaleler
  const filteredArticles = useMemo(() => {
    if (timeFilter === "all") return articles;
    const limits = {
      "1h": 60 * 60 * 1000,
      today: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    };
    const limit = limits[timeFilter];
    return articles.filter((a) => articleAge(a.pubDate) <= limit);
  }, [articles, timeFilter]);

  const hasPrefs =
    prefs.followedTopics.length > 0 || prefs.preferredCategories.length > 0;

  // Tercih varsa ikiye böl
  const forYouArticles = useMemo(
    () =>
      hasPrefs
        ? filteredArticles.filter((a) =>
            articleMatchesPrefs(
              a,
              prefs.followedTopics,
              prefs.preferredCategories,
            ),
          )
        : [],
    [
      filteredArticles,
      hasPrefs,
      prefs.followedTopics,
      prefs.preferredCategories,
    ],
  );

  const otherArticles = useMemo(
    () =>
      hasPrefs
        ? filteredArticles.filter(
            (a) =>
              !articleMatchesPrefs(
                a,
                prefs.followedTopics,
                prefs.preferredCategories,
              ),
          )
        : filteredArticles,
    [
      filteredArticles,
      hasPrefs,
      prefs.followedTopics,
      prefs.preferredCategories,
    ],
  );

  // Client mount'ta localStorage geçmişine + tercihli kategorilere + takip edilen konulara göre sırala
  useEffect(() => {
    function applyPrefs() {
      const { preferredCategories = [], followedTopics = [] } = (() => {
        try {
          return JSON.parse(
            localStorage.getItem("haberai:user-preferences") || "{}",
          );
        } catch {
          return {};
        }
      })();
      setPrefs({ followedTopics, preferredCategories });
      if (followedTopics.length > 0 || preferredCategories.length > 0) {
        setActiveTab("forYou");
      }
      setArticles((prev) =>
        sortByFollowedTopics(
          sortByPreferredCategories(sortByHistory(prev), preferredCategories),
          followedTopics,
        ),
      );
    }

    applyPrefs();

    // Settings sayfasından değiştirilince güncelle
    const onStorage = (e) => {
      if (!e.key || e.key === "haberai:user-preferences") applyPrefs();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextPage || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/news?page=${nextPage}`);
      const data = await res.json();

      setArticles((prev) => {
        // Duplicate'leri çıkar
        const existingIds = new Set(prev.map((a) => a.article_id));
        const fresh = (data.results || []).filter(
          (a) => !existingIds.has(a.article_id),
        );
        return sortByHistory([...prev, ...fresh]);
      });

      setNextPage(data.nextPage || null);
      if (!data.nextPage) setExhausted(true);
    } catch (err) {
      console.error("[NewsFeed] Load more error:", err);
    } finally {
      setLoading(false);
    }
  }, [nextPage, loading]);

  // Sekme kaydırma (dokunma)
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback(
    (e) => {
      if (touchStartX.current === null || !hasPrefs) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(dx) < 50) return;
      if (dx < 0 && activeTab === "forYou") setActiveTab("gundem");
      if (dx > 0 && activeTab === "gundem") setActiveTab("forYou");
      touchStartX.current = null;
    },
    [activeTab, hasPrefs],
  );

  const gundemArticles = hasPrefs ? otherArticles : filteredArticles;

  // Pull indicator - yüzde doluluk (0-1)
  const progress = Math.min(pullY / threshold, 1);
  const triggered = pullY >= threshold;

  return (
    <div>
      {/* ── Pull-to-Refresh Göstergesi (sadece mobilde) ── */}
      {(pullY > 0 || refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-150 md:hidden"
          style={{ height: refreshing ? 48 : pullY }}>
          <div
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              refreshing
                ? "text-amber-500"
                : triggered
                  ? "text-amber-500"
                  : "text-stone-400 dark:text-stone-500"
            }`}>
            {refreshing ? (
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 100 10z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 transition-transform duration-200"
                style={{
                  transform: triggered
                    ? "rotate(180deg)"
                    : `rotate(${progress * 180}deg)`,
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
            <span>
              {refreshing
                ? "Yenileniyor…"
                : triggered
                  ? "Bırak, yenile!"
                  : "Yenilemek için çek"}
            </span>
          </div>
        </div>
      )}

      {/* ── Sekme Çubuğu ── */}
      {showTabs && (
        <div className="sticky top-14 z-20 -mx-4 px-0 md:mx-0 bg-white/95 dark:bg-stone-950/95 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800">
          <div className="flex">
            {hasPrefs && (
              <button
                onClick={() => setActiveTab("forYou")}
                className={`relative py-3.5 px-6 text-sm font-bold transition-colors ${
                  activeTab === "forYou"
                    ? "text-stone-900 dark:text-stone-100"
                    : "text-stone-400 dark:text-stone-500"
                }`}>
                Senin İçin
                {activeTab === "forYou" && (
                  <span className="absolute bottom-0 inset-x-2 h-0.5 bg-amber-500 rounded-full" />
                )}
              </button>
            )}
            <button
              onClick={() => setActiveTab("gundem")}
              className={`relative py-3.5 px-6 text-sm font-bold transition-colors ${
                activeTab === "gundem"
                  ? "text-stone-900 dark:text-stone-100"
                  : "text-stone-400 dark:text-stone-500"
              }`}>
              Gündem
              {activeTab === "gundem" && (
                <span className="absolute bottom-0 inset-x-2 h-0.5 bg-amber-500 rounded-full" />
              )}
            </button>
          </div>
        </div>
      )}
      {/* ── Kaydırılabilir İçerik ── */}
      <div
        className="overflow-hidden"
        onTouchStart={showTabs ? handleTouchStart : undefined}
        onTouchEnd={showTabs ? handleTouchEnd : undefined}>
        <div
          className="flex transition-transform duration-300 ease-in-out will-change-transform"
          style={{
            width: showTabs && hasPrefs ? "200%" : "100%",
            transform:
              showTabs && hasPrefs && activeTab === "gundem"
                ? "translateX(-50%)"
                : "translateX(0%)",
          }}>
          {/* ─ Panel 1: Senin İçin (showTabs + tercih varsa) ─ */}
          {showTabs && hasPrefs && (
            <div className="w-1/2 shrink-0 pt-4">
              <TimeFilterBar
                timeFilter={timeFilter}
                setTimeFilter={setTimeFilter}
                showCount={false}
              />

              {forYouArticles.length > 0 ? (
                <>
                  {/* Mobil: ilk 3 featured */}
                  <div className="grid grid-cols-1 gap-4 md:hidden mb-4">
                    {forYouArticles.slice(0, 3).map((article, index) => (
                      <NewsCard
                        key={article.article_id}
                        article={article}
                        priority={index < 2}
                        featured
                      />
                    ))}
                  </div>
                  {/* Mobil: kalan */}
                  {forYouArticles.length > 3 && (
                    <div className="grid grid-cols-1 gap-4 md:hidden mb-2">
                      {forYouArticles.slice(3).map((article) => (
                        <NewsCard key={article.article_id} article={article} />
                      ))}
                    </div>
                  )}
                  {/* Desktop: 2-3 sütun */}
                  <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {forYouArticles.map((article, index) => (
                      <NewsCard
                        key={article.article_id}
                        article={article}
                        priority={index < 3}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center border border-dashed border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl mt-2">
                  <p className="text-2xl mb-2">🔍</p>
                  <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                    Takip ettiğin konularda yeni haber yok
                  </p>
                  <a
                    href="/settings"
                    className="inline-block mt-3 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
                    Konularını güncelle →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ─ Panel 2: Gündem ─ */}
          <div
            className={`${showTabs && hasPrefs ? "w-1/2" : "w-full"} shrink-0 pt-4`}>
            <TimeFilterBar
              timeFilter={timeFilter}
              setTimeFilter={setTimeFilter}
              count={timeFilter !== "all" ? gundemArticles.length : null}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {gundemArticles.length === 0 ? (
                <div className="col-span-full py-16 text-center">
                  <p className="text-3xl mb-3">🕐</p>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    Bu zaman aralığında haber bulunamadı
                  </p>
                  <button
                    onClick={() => setTimeFilter("all")}
                    className="mt-3 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
                    Tüm haberlere bak →
                  </button>
                </div>
              ) : (
                gundemArticles.map((article, index) => (
                  <NewsCard
                    key={article.article_id}
                    article={article}
                    priority={!hasPrefs && index < 3}
                  />
                ))
              )}
              {loading &&
                [0, 1, 2].map((i) => (
                  <NewsCardSkeleton key={`sk-${i}`} index={i} />
                ))}
            </div>

            {/* Load more */}
            <div className="flex flex-col items-center gap-2 mt-10 mb-4">
              {!exhausted ? (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 font-semibold text-white transition-all bg-gray-900 dark:bg-white dark:text-gray-900 rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                  {loading ? (
                    "Yükleniyor..."
                  ) : (
                    <>
                      Daha Fazla Haber
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Tüm haberler yüklendi — {articles.length} haber
                  {timeFilter !== "all"
                    ? `, ${gundemArticles.length} gösteriliyor`
                    : " gösteriliyor"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
