"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/app/lib/siteConfig";
import { useUserPreferences } from "@/app/lib/useUserPreferences";

/**
 * FeedPersonalizationSection — Category toggles, personalization mode,
 * international news toggle, with auto-save to localStorage.
 */
export default function FeedPersonalizationSection() {
  const { prefs, setPrefs, mounted } = useUserPreferences();
  const [personalize, setPersonalize] = useState(true);
  const [showIntl, setShowIntl] = useState(true);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    Promise.resolve().then(() => {
      setPersonalize(localStorage.getItem("haberai_personalize") !== "false");
      setShowIntl(localStorage.getItem("haberai_show_intl") !== "false");
    });
  }, [mounted]);

  const toggleCategory = (slug) => {
    setPrefs((prev) => {
      const has = prev.preferredCategories.includes(slug);
      return {
        ...prev,
        preferredCategories: has
          ? prev.preferredCategories.filter((s) => s !== slug)
          : [...prev.preferredCategories, slug],
      };
    });
  };

  const togglePersonalize = () => {
    const next = !personalize;
    setPersonalize(next);
    localStorage.setItem("haberai_personalize", String(next));
  };

  const toggleIntl = () => {
    const next = !showIntl;
    setShowIntl(next);
    localStorage.setItem("haberai_show_intl", String(next));
  };

  const handleReset = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }
    setPrefs({
      preferredCategories: [],
      language: "tr",
      summaryLength: "normal",
      dimReadArticles: true,
    });
    setPersonalize(true);
    setShowIntl(true);
    localStorage.setItem("haberai_personalize", "true");
    localStorage.setItem("haberai_show_intl", "true");
    setResetConfirm(false);
  };

  if (!mounted) return null;

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
          🎯 Akış Kişiselleştirme
        </p>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Personalization toggle */}
        <ToggleRow
          label="Kişiselleştirilmiş akış"
          description="Kategorilere göre haberleri sıralar"
          active={personalize}
          onToggle={togglePersonalize}
        />

        {/* International news toggle */}
        <ToggleRow
          label="Dünya haberleri göster"
          description="Ana sayfada uluslararası haber şeridi"
          active={showIntl}
          onToggle={toggleIntl}
        />

        {/* Category toggles */}
        <div style={{ marginTop: "16px" }}>
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
            Tercihli Kategoriler
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginBottom: "12px",
            }}
          >
            Seçili kategoriler ana akışta önce gösterilir.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "8px",
            }}
          >
            {CATEGORIES.map((cat) => {
              const active = prefs.preferredCategories.includes(cat.slug);
              return (
                <button
                  key={cat.slug}
                  onClick={() => toggleCategory(cat.slug)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    ...(active
                      ? {
                          background: "rgba(245, 158, 11, 0.15)",
                          borderColor: "rgba(245, 158, 11, 0.5)",
                          color: "var(--accent-brand)",
                        }
                      : {
                          background: "var(--bg-elevated)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }),
                  }}
                >
                  <span>{cat.icon}</span>
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat.title}
                  </span>
                  {active && (
                    <span style={{ marginLeft: "auto", color: "var(--accent-brand)" }}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {prefs.preferredCategories.length > 0 && (
            <p
              style={{
                marginTop: "10px",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              {prefs.preferredCategories.length} kategori seçili
            </p>
          )}
        </div>

        {/* Reset */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={handleReset}
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "6px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              background: resetConfirm ? "var(--danger)" : "var(--bg-elevated)",
              color: resetConfirm ? "#fff" : "var(--text-muted)",
            }}
          >
            {resetConfirm ? "Emin misin? Tıkla" : "Sıfırla"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, active, onToggle }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        padding: "12px 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {label}
        </p>
        {description && (
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            {description}
          </p>
        )}
      </div>
      <button
        onClick={onToggle}
        style={{
          position: "relative",
          width: "44px",
          height: "24px",
          borderRadius: "12px",
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background 0.2s",
          background: active ? "var(--accent-brand)" : "var(--bg-elevated)",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: active ? "22px" : "2px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "left 0.2s",
          }}
        />
      </button>
    </div>
  );
}
