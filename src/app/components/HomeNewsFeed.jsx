"use client";

import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/app/lib/categoryConfig";
import { getPersonalizedCategoryOrder } from "@/app/lib/categoryStats";
import {
  sortByPreferredCategories,
  useUserPreferences,
} from "@/app/lib/useUserPreferences";
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

  // Reader bottom sheet
  const [readerArticle, setReaderArticle] = useState(null);
  const [readerOpen, setReaderOpen] = useState(false);

  const handleReaderOpen = useCallback((article) => {
    setReaderArticle(article);
    setReaderOpen(true);
  }, []);

  const handleReaderClose = useCallback(() => {
    setReaderOpen(false);
  }, []);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/news?page=1&pageSize=30");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const results = (data.results || []).map(normalizeArticle);
      setArticles(results);
      setNextPage(data.nextPage || null);
      setExhausted(!data.nextPage);
      if (!results.length) setFetchError(true);
    } catch (err) {
      console.error("[HomeNewsFeed] Initial fetch failed:", err);
      setArticles([]);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  // Personalization — reorder tabs based on reading stats
  useEffect(() => {
    if (typeof window === "undefined") return;

    const personalize =
      localStorage.getItem("haberai_personalize") !== "false";
    if (!personalize) return;

    const order = getPersonalizedCategoryOrder();
    if (!order || order.length < 3) return;

    // Build personalized tab order
    const personalizedTabs = [{ key: "all", label: "Senin için" }];
    const seen = new Set(["all"]);

    for (const cat of order.slice(0, 4)) {
      const tab = TABS.find((t) => t.key === cat);
      if (tab && !seen.has(tab.key)) {
        personalizedTabs.push(tab);
        seen.add(tab.key);
      }
    }

    // Add remaining tabs
    for (const tab of TABS) {
      if (!seen.has(tab.key)) {
        personalizedTabs.push(tab);
        seen.add(tab.key);
      }
    }

    setTabs(personalizedTabs);
  }, []);

  // Filter articles by active tab (domestic ≡ politics)
  const filteredArticles = useMemo(() => {
    let list;
    if (activeTab === "all") {
      list = articles;
    } else {
      const aliases =
        activeTab === "domestic"
          ? ["domestic", "politics", "gundem"]
          : [activeTab];
      list = articles.filter((a) => {
        const cats = Array.isArray(a.category)
          ? a.category
          : a.category
            ? [a.category]
            : [];
        return cats.some((c) =>
          aliases.includes(String(c).toLowerCase()),
        );
      });
    }
    if (activeTab === "all") {
      return sortByPreferredCategories(list, prefs.preferredCategories);
    }
    return list;
  }, [articles, activeTab, prefs.preferredCategories]);

  // Load more
  const loadMore = useCallback(async () => {
    if (!nextPage || loadingMore) return;
    setLoadingMore(true);

    try {
      const res = await fetch(`/api/news?page=${nextPage}`);
      const data = await res.json();
      const existingIds = new Set(articles.map((a) => a.article_id));
      const fresh = (data.results || [])
        .map(normalizeArticle)
        .filter((a) => !existingIds.has(a.article_id));
      setArticles((prev) => [...prev, ...fresh]);
      setNextPage(data.nextPage || null);
      if (!data.nextPage) setExhausted(true);
    } catch (err) {
      console.error("[HomeNewsFeed] Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [nextPage, loadingMore, articles]);

  if (loading) {
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
          onClick={fetchInitial}
          className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest bg-[var(--text-primary)] text-[var(--bg-primary)] border-0 cursor-pointer"
        >
          Yeniden dene
        </button>
      </div>
    );
  }

  const heroArticle = filteredArticles[0] || null;
  const gridArticles = filteredArticles.slice(1, 7);
  const listArticles = filteredArticles.slice(7);

  return (
    <div>
      <div className="scrollbar-hide flex gap-0 overflow-x-auto border-b border-[var(--border-subtle)] mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 px-3.5 py-2.5 text-[11px] font-black uppercase tracking-widest border-r border-[var(--border-subtle)] transition-colors ${
              activeTab === tab.key
                ? "text-[var(--text-primary)] bg-[var(--bg-secondary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-12 px-4 text-[var(--text-muted)]">
          <p className="text-sm font-medium mb-3">
            {activeTab === "world"
              ? "Uluslararası masa şu an boş — biraz sonra yenile."
              : "Bu kategoride haber bulunamadı"}
          </p>
          {activeTab !== "world" && (
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className="text-[11px] font-black uppercase tracking-widest text-[var(--accent-brand)] bg-transparent border-0 cursor-pointer"
            >
              Tüm haberlere bak →
            </button>
          )}
        </div>
      )}

      {/* Hero — first article */}
      {heroArticle && (
        <BlurFade delay={0.1} inView>
          <div style={{ marginBottom: "20px" }}>
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

      {/* 2-column grid — articles 2-7 */}
      {gridArticles.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {gridArticles.map((article, idx) => (
            <BlurFade key={article.article_id || `grid-${idx}`} delay={0.15 + idx * 0.05} inView>
              <NewsCard
                article={article}
                priority={idx < 2}
                onReaderOpen={handleReaderOpen}
              />
            </BlurFade>
          ))}
        </div>
      )}

      {/* List — remaining articles */}
      {listArticles.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {listArticles.map((article, idx) => (
            <NewsCard
              key={article.article_id || `list-${idx}`}
              article={article}
              onReaderOpen={handleReaderOpen}
            />
          ))}
        </div>
      )}

      {/* Loading skeletons */}
      {loadingMore && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
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
            className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest bg-[var(--text-primary)] text-[var(--bg-primary)] border-0 cursor-pointer transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingMore ? "Yükleniyor..." : "Daha fazla haber"}
          </button>
        ) : (
          <p className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
            Tüm haberler yüklendi — {articles.length} haber
          </p>
        )}
      </div>

      {/* Reader Bottom Sheet */}
      <ReaderBottomSheet
        isOpen={readerOpen}
        onClose={handleReaderClose}
        article={readerArticle}
      />
    </div>
  );
}
