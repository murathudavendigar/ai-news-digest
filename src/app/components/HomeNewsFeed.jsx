"use client";

import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/app/lib/categoryConfig";
import { getPersonalizedCategoryOrder } from "@/app/lib/categoryStats";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NewsCard from "./NewsCard";
import NewsCardSkeleton from "./NewsCardSkeleton";
import HeroNewsCard from "./HeroNewsCard";
import ReaderBottomSheet from "./ReaderBottomSheet";
import { normalizeArticle } from "@/app/lib/newsUtils";

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

  // Initial fetch
  useEffect(() => {
    async function fetchInitial() {
      try {
        const res = await fetch("/api/news?page=1&pageSize=30");
        const data = await res.json();
        const results = (data.results || []).map(normalizeArticle);
        setArticles(results);
        setNextPage(data.nextPage || null);
        setExhausted(!data.nextPage);
      } catch (err) {
        console.error("[HomeNewsFeed] Initial fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInitial();
  }, []);

  // Personalization — reorder tabs based on reading stats
  useEffect(() => {
    if (typeof window === "undefined") return;

    const personalize =
      localStorage.getItem("haberai_personalize") !== "false";
    if (!personalize) return;

    const order = getPersonalizedCategoryOrder();
    if (!order || order.length < 3) return;

    // Build personalized tab order
    const personalizedTabs = [{ key: "all", label: "✨ Senin İçin" }];
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

  // Filter articles by active tab
  const filteredArticles = useMemo(() => {
    if (activeTab === "all") return articles;
    return articles.filter((a) => {
      const cats = a.category || [];
      return cats.some((c) => c?.toLowerCase() === activeTab);
    });
  }, [articles, activeTab]);

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

  // Skeleton during initial load
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <NewsCardSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  const heroArticle = filteredArticles[0] || null;
  const gridArticles = filteredArticles.slice(1, 7);
  const listArticles = filteredArticles.slice(7);

  return (
    <div>
      {/* Category Tabs */}
      <div
        className="scrollbar-hide"
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "12px",
          marginBottom: "4px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flexShrink: 0,
              padding: "8px 16px",
              borderRadius: "var(--radius-xl)",
              fontSize: "13px",
              fontWeight: 600,
              border: "1px solid",
              cursor: "pointer",
              transition: "all 0.2s",
              ...(activeTab === tab.key
                ? {
                    background: "var(--accent-brand)",
                    color: "#fff",
                    borderColor: "var(--accent-brand)",
                  }
                : {
                    background: "transparent",
                    color: "var(--text-muted)",
                    borderColor: "var(--border-subtle)",
                  }),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredArticles.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "48px 16px",
            color: "var(--text-muted)",
          }}
        >
          <p style={{ fontSize: "48px", marginBottom: "12px" }}>📭</p>
          <p style={{ fontSize: "14px", fontWeight: 500 }}>
            Bu kategoride haber bulunamadı
          </p>
          <button
            onClick={() => setActiveTab("all")}
            style={{
              marginTop: "12px",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--accent-brand)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Tüm haberlere bak →
          </button>
        </div>
      )}

      {/* Hero — first article */}
      {heroArticle && (
        <div style={{ marginBottom: "20px" }}>
          <HeroNewsCard article={heroArticle} />
        </div>
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
            <NewsCard
              key={article.article_id || `grid-${idx}`}
              article={article}
              priority={idx < 2}
              onReaderOpen={handleReaderOpen}
            />
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

      {/* Load more / exhausted */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "32px 0 16px",
        }}
      >
        {!exhausted ? (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              padding: "12px 32px",
              borderRadius: "var(--radius-md)",
              fontSize: "14px",
              fontWeight: 700,
              background: "var(--text-primary)",
              color: "var(--bg-primary)",
              border: "none",
              cursor: loadingMore ? "not-allowed" : "pointer",
              opacity: loadingMore ? 0.4 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loadingMore ? "Yükleniyor..." : "Daha Fazla Haber"}
          </button>
        ) : (
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
            }}
          >
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
