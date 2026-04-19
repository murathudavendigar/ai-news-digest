"use client";

import { useEffect, useState } from "react";
import { CATEGORY_LABELS } from "@/app/lib/categoryConfig";

/**
 * UserStatsSection — Reading statistics from localStorage
 * Shows weekly / total count, streak, category distribution, top sources, total reading time.
 */
export default function UserStatsSection() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("haberai:article-history");
      if (!raw) return;
      const history = JSON.parse(raw);
      if (!Array.isArray(history) || history.length === 0) return;

      const now = Date.now();
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

      // Weekly count
      const weeklyCount = history.filter(
        (h) => now - new Date(h.readAt || h.timestamp).getTime() < ONE_WEEK
      ).length;

      // Category distribution
      const catMap = {};
      const sourceMap = {};
      let totalReadTime = 0;

      for (const h of history) {
        // Category
        const cat = h.category?.[0] || h.category || "other";
        catMap[cat] = (catMap[cat] || 0) + 1;

        // Source
        const src = h.source_name || h.sourceName || "Diğer";
        sourceMap[src] = (sourceMap[src] || 0) + 1;

        // Reading time (rough: 2 min per article)
        totalReadTime += h.readTimeSeconds || 120;
      }

      // Sort categories by count
      const categories = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

      const maxCatCount = categories[0]?.[1] || 1;

      // Top sources
      const topSources = Object.entries(sourceMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Reading streak (consecutive days)
      const daySet = new Set(
        history.map((h) =>
          new Date(h.readAt || h.timestamp).toISOString().split("T")[0]
        )
      );
      let streak = 0;
      const d = new Date();
      while (daySet.has(d.toISOString().split("T")[0])) {
        streak++;
        d.setDate(d.getDate() - 1);
      }

      Promise.resolve().then(() => setStats({
        total: history.length,
        weeklyCount,
        streak,
        categories,
        maxCatCount,
        topSources,
        totalReadMinutes: Math.round(totalReadTime / 60),
      }));
    } catch {
      // Silent
    }
  }, []);

  if (!stats) return null;

  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-card)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-elevated)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "11px",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
          }}
        >
          📊 Okuma Geçmişi & İstatistikler
        </p>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Stat cards row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <StatCard label="Bu Hafta" value={stats.weeklyCount} suffix="haber" />
          <StatCard label="Toplam" value={stats.total} suffix="haber" />
          <StatCard label="Seri" value={stats.streak} suffix="gün 🔥" />
        </div>

        {/* Category distribution */}
        {stats.categories.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-muted)",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Kategori Dağılımı
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {stats.categories.map(([cat, count]) => (
                <div
                  key={cat}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      width: "80px",
                      flexShrink: 0,
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {CATEGORY_LABELS[cat?.toLowerCase()] || cat}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "8px",
                      borderRadius: "4px",
                      background: "var(--bg-elevated)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(count / stats.maxCatCount) * 100}%`,
                        height: "100%",
                        borderRadius: "4px",
                        background: "var(--accent-brand)",
                        transition: "width 0.5s ease-out",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      width: "28px",
                      textAlign: "right",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top sources */}
        {stats.topSources.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-muted)",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              En Çok Okunan Kaynaklar
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {stats.topSources.map(([source, count], idx) => (
                <div
                  key={source}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom:
                      idx < stats.topSources.length - 1
                        ? "1px solid var(--border-subtle)"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {source}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {count} haber
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total reading time */}
        <div
          style={{
            padding: "12px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-elevated)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 900,
              color: "var(--accent-brand)",
            }}
          >
            {stats.totalReadMinutes < 60
              ? `${stats.totalReadMinutes}dk`
              : `${Math.floor(stats.totalReadMinutes / 60)}sa ${stats.totalReadMinutes % 60}dk`}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            Toplam okuma süresi
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "12px 8px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-elevated)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "24px",
          fontWeight: 900,
          color: "var(--text-primary)",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          margin: "4px 0 0",
          fontSize: "11px",
          color: "var(--text-muted)",
        }}
      >
        {suffix && (
          <span style={{ fontWeight: 600 }}>
            {suffix}
          </span>
        )}
      </p>
      <p
        style={{
          margin: "2px 0 0",
          fontSize: "9px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </p>
    </div>
  );
}
