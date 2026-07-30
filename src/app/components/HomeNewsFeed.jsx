"use client";

import { getPersonalizedCategoryOrder } from "@/app/lib/categoryStats";
import {
  sortByFollowedTopics,
  sortByPreferredCategories,
  useUserPreferences,
} from "@/app/lib/useUserPreferences";
import { usePullToRefresh } from "@/app/hooks/usePullToRefresh";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NewsCard from "./NewsCard";
import NewsCardSkeleton from "./NewsCardSkeleton";
import HeroNewsCard from "./HeroNewsCard";
import ReaderBottomSheet from "./ReaderBottomSheet";
import { normalizeArticle } from "@/app/lib/newsUtils";
import { BlurFade } from "@/components/ui/blur-fade";

const TABS = [
  { key: "all", label: "Tümü" },
  { key: "domestic", label: "Gündem" },
  { key: "business", label: "Ekonomi" },
  { key: "sports", label: "Spor" },
  { key: "technology", label: "Teknoloji" },
  { key: "world", label: "Dünya" },
  { key: "health", label: "Sağlık" },
];

/** UI tab → API category */
function apiCategoryForTab(tab) {
  if (!tab || tab === "all") return null;
  if (tab === "domestic") return "politics";
  return tab;
}

export default function HomeNewsFeed() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [exhausted, setExhausted] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [tabs, setTabs] = useState(TABS);
  const [fetchError, setFetchError] = useState(false);
  const { prefs } = useUserPreferences();

  const [readerArticle, setReaderArticle] = useState(null);
  const [readerOpen, setReaderOpen] = useState(false);

  /** Tab başına son başarılı sonuç — geri dönüşlerde anında göster */
  const tabCache = useRef(new Map());
  const fetchGen = useRef(0);

  const handleReaderOpen = useCallback((article) => {
    setReaderArticle(article);
    setReaderOpen(true);
  }, []);

  const handleReaderClose = useCallback(() => {
    setReaderOpen(false);
  }, []);

  const fetchForTab = useCallback(async (tab, { soft = false } = {}) => {
    const gen = ++fetchGen.current;
    const cached = tabCache.current.get(tab);
    if (cached?.articles?.length && soft) {
      setArticles(cached.articles);
      setNextPage(cached.nextPage);
      setExhausted(!cached.nextPage);
      setFetchError(false);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setFetchError(false);

    try {
      const cat = apiCategoryForTab(tab);
      const qs = new URLSearchParams({ page: "1", pageSize: "30" });
      if (cat) qs.set("category", cat);
      const res = await fetch(`/api/news?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (gen !== fetchGen.current) return;

      const results = (data.results || []).map(normalizeArticle);
      const payload = {
        articles: results,
        nextPage: data.nextPage || null,
      };
      tabCache.current.set(tab, payload);
      setArticles(results);
      setNextPage(payload.nextPage);
      setExhausted(!payload.nextPage);
      if (!results.length) setFetchError(true);
    } catch (err) {
      console.error("[HomeNewsFeed] fetch failed:", err);
      if (gen !== fetchGen.current) return;
      if (!tabCache.current.get(tab)?.articles?.length) {
        setArticles([]);
        setFetchError(true);
      }
    } finally {
      if (gen === fetchGen.current) setLoading(false);
    }
  }, []);

  // İlk yükleme + tab değişimi → kategori feed
  useEffect(() => {
    const soft = tabCache.current.has(activeTab);
    fetchForTab(activeTab, { soft });
  }, [activeTab, fetchForTab]);

  // Personalization — reorder tabs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const personalize =
      localStorage.getItem("haberai_personalize") !== "false";
    if (!personalize) return;

    const order = getPersonalizedCategoryOrder();
    if (!order || order.length < 3) return;

    const personalizedTabs = [{ key: "all", label: "Senin için" }];
    const seen = new Set(["all"]);

    for (const cat of order.slice(0, 4)) {
      const tab = TABS.find((t) => t.key === cat);
      if (tab && !seen.has(tab.key)) {
        personalizedTabs.push(tab);
        seen.add(tab.key);
      }
    }

    for (const tab of TABS) {
      if (!seen.has(tab.key)) {
        personalizedTabs.push(tab);
        seen.add(tab.key);
      }
    }

    setTabs(personalizedTabs);
  }, []);

  const displayArticles = useMemo(() => {
    let list = articles;
    if (activeTab === "all") {
      list = sortByPreferredCategories(list, prefs.preferredCategories);
      list = sortByFollowedTopics(list, prefs.followedTopics);
    }
    return list;
  }, [
    articles,
    activeTab,
    prefs.preferredCategories,
    prefs.followedTopics,
  ]);

  const loadMore = useCallback(async () => {
    if (!nextPage || loadingMore) return;
    setLoadingMore(true);

    try {
      const cat = apiCategoryForTab(activeTab);
      const qs = new URLSearchParams({
        page: String(nextPage),
        pageSize: "30",
      });
      if (cat) qs.set("category", cat);
      const res = await fetch(`/api/news?${qs}`);
      const data = await res.json();
      const existingIds = new Set(articles.map((a) => a.article_id));
      const fresh = (data.results || [])
        .map(normalizeArticle)
        .filter((a) => !existingIds.has(a.article_id));
      const merged = [...articles, ...fresh];
      setArticles(merged);
      setNextPage(data.nextPage || null);
      if (!data.nextPage) setExhausted(true);
      tabCache.current.set(activeTab, {
        articles: merged,
        nextPage: data.nextPage || null,
      });
    } catch (err) {
      console.error("[HomeNewsFeed] Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [nextPage, loadingMore, articles, activeTab]);

  const handlePullRefresh = useCallback(async () => {
    tabCache.current.clear();
    await fetchForTab(activeTab);
  }, [activeTab, fetchForTab]);

  const { pullY, refreshing, threshold } = usePullToRefresh({
    onRefresh: handlePullRefresh,
  });
  const pullProgress = Math.min(pullY / threshold, 1);
  const pullTriggered = pullY >= threshold;

  if (loading && articles.length === 0 && !refreshing) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <NewsCardSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  if (fetchError && articles.length === 0) {
    return (
      <div className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-6 py-12 text-center">
        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Manşet
        </p>
        <p className="mb-2 text-sm font-bold text-[var(--text-primary)]">
          Haberler şu an yüklenemedi
        </p>
        <p className="mb-5 text-xs text-[var(--text-secondary)]">
          Bağlantıyı kontrol edip tekrar dene.
        </p>
        <button
          type="button"
          onClick={() => fetchForTab(activeTab)}
          className="cursor-pointer border-0 bg-[var(--text-primary)] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--bg-primary)]"
        >
          Yeniden dene
        </button>
      </div>
    );
  }

  const heroArticle = displayArticles[0] || null;
  const gridArticles = displayArticles.slice(1, 7);
  const listArticles = displayArticles.slice(7);

  return (
    <div>
      {(pullY > 0 || refreshing) && (
        <div
          className="mb-2 flex items-center justify-center overflow-hidden transition-all duration-150 md:hidden"
          style={{ height: refreshing ? 48 : pullY }}
        >
          <div
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              refreshing || pullTriggered
                ? "text-amber-500"
                : "text-stone-400 dark:text-stone-500"
            }`}
          >
            {refreshing ? (
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
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
                className="h-5 w-5 transition-transform duration-200"
                style={{
                  transform: pullTriggered
                    ? "rotate(180deg)"
                    : `rotate(${pullProgress * 180}deg)`,
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
                : pullTriggered
                  ? "Bırak, yenile!"
                  : "Yenilemek için çek"}
            </span>
          </div>
        </div>
      )}

      <div className="scrollbar-hide mb-5 flex gap-0 overflow-x-auto border-b border-[var(--border-subtle)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 border-r border-[var(--border-subtle)] px-3.5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-colors ${
              activeTab === tab.key
                ? "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && articles.length > 0 && (
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Güncelleniyor…
        </p>
      )}

      {displayArticles.length === 0 && (
        <div className="px-4 py-12 text-center text-[var(--text-muted)]">
          <p className="mb-3 text-sm font-medium">
            {activeTab === "world"
              ? "Uluslararası masa şu an boş — biraz sonra yenile."
              : "Bu kategoride haber bulunamadı"}
          </p>
          {activeTab !== "all" && (
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className="cursor-pointer border-0 bg-transparent text-[11px] font-black uppercase tracking-widest text-[var(--accent-brand)]"
            >
              Tüm haberlere bak →
            </button>
          )}
        </div>
      )}

      {heroArticle && (
        <BlurFade delay={0.1} inView>
          <div className="mb-5">
            {activeTab === "world" && (
              <p className="homepage-section-label mb-3">
                Uluslararası masa
                <span className="homepage-section-rule" aria-hidden="true" />
              </p>
            )}
            <HeroNewsCard article={heroArticle} />
          </div>
        </BlurFade>
      )}

      {gridArticles.length > 0 && (
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gridArticles.map((article, idx) => (
            <BlurFade
              key={article.article_id || `grid-${idx}`}
              delay={0.15 + idx * 0.05}
              inView
            >
              <NewsCard
                article={article}
                priority={idx < 2}
                onReaderOpen={handleReaderOpen}
              />
            </BlurFade>
          ))}
        </div>
      )}

      {listArticles.length > 0 && (
        <div className="flex flex-col gap-3">
          {listArticles.map((article, idx) => (
            <NewsCard
              key={article.article_id || `list-${idx}`}
              article={article}
              onReaderOpen={handleReaderOpen}
            />
          ))}
        </div>
      )}

      {loadingMore && (
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <NewsCardSkeleton key={`sk-${i}`} index={i} />
          ))}
        </div>
      )}

      <div className="flex justify-center py-8">
        {!exhausted ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="cursor-pointer border-0 bg-[var(--text-primary)] px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--bg-primary)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loadingMore ? "Yükleniyor..." : "Daha fazla haber"}
          </button>
        ) : (
          <p className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
            Tüm haberler yüklendi — {displayArticles.length} haber
          </p>
        )}
      </div>

      <ReaderBottomSheet
        isOpen={readerOpen}
        onClose={handleReaderClose}
        article={readerArticle}
      />
    </div>
  );
}
