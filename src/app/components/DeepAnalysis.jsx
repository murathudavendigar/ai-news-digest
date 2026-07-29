"use client";

import { useCallback, useState } from "react";
import AiDisclosure from "./AiDisclosure";

/**
 * DeepAnalysis — "Arka Plan" deep analysis component
 *
 * Props: { articleSlug, articleTitle, articleUrl }
 *
 * States: idle → loading → loaded → error
 * Only fetches when button is clicked (lazy).
 */
export default function DeepAnalysis({ articleSlug, articleTitle, articleUrl }) {
  const [state, setState] = useState("idle"); // idle | loading | loaded | error
  const [data, setData] = useState(null);
  const [isCached, setIsCached] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    setState("loading");

    try {
      const params = new URLSearchParams({ title: articleTitle });
      if (articleUrl) params.set("url", articleUrl);

      const res = await fetch(`/api/analysis/${articleSlug}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();
      if (result.error) throw new Error(result.message || result.error);

      setData(result);
      setIsCached(!!result.cached);
      setState("loaded");
    } catch (err) {
      console.error("[DeepAnalysis]", err.message);
      setState("error");
    }
  }, [articleSlug, articleTitle, articleUrl]);

  if (state === "idle") {
    return (
      <div className="my-8 py-5 border-y border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={fetchAnalysis}
          className="w-full flex items-center justify-between gap-4 text-left bg-transparent border-0 cursor-pointer group"
        >
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] block mb-1">
              Derinlik
            </span>
            <span className="text-sm font-bold text-[var(--text-primary)] block">
              Arka planı gör
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              Yapay zeka destekli bağlam ve kaynak analizi
            </span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-[var(--accent-brand)] group-hover:translate-x-0.5 transition-transform">
            Aç →
          </span>
        </button>
      </div>
    );
  }

  // ── Loading: Skeleton sections ──
  if (state === "loading") {
    return (
      <div className="my-6 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="text-[10px] font-black uppercase tracking-[0.2em]"
            style={{ color: "var(--text-muted)" }}
          >
            Analiz hazırlanıyor
            <LoadingDots />
          </span>
        </div>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl p-4"
            style={{ background: "var(--bg-elevated)" }}
          >
            <div
              className="h-4 w-1/3 rounded mb-3"
              style={{ background: "var(--border-subtle)" }}
            />
            <div
              className="h-3 w-full rounded mb-2"
              style={{ background: "var(--border-subtle)" }}
            />
            <div
              className="h-3 w-2/3 rounded"
              style={{ background: "var(--border-subtle)" }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="my-8 py-5 border-y border-[var(--border-subtle)]">
        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Derinlik
        </p>
        <p className="mb-1 text-sm font-bold text-[var(--text-primary)]">
          Analiz şu an kullanılamıyor
        </p>
        <p className="mb-3 text-xs text-[var(--text-secondary)]">
          Sağlayıcı yoğun olabilir. Biraz sonra tekrar dene.
        </p>
        <button
          type="button"
          onClick={() => {
            setData(null);
            fetchAnalysis();
          }}
          className="text-[11px] font-black uppercase tracking-widest text-[var(--accent-brand)] bg-transparent border-0 cursor-pointer"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  // ── Loaded: Display analysis sections ──
  if (!data) return null;

  return (
    <div className="my-6 space-y-3">
      {/* Section 1 — KONU NEDİR? */}
      {data.whatIsIt && (
        <AnalysisSection
          icon="📖"
          title="Konu Nedir?"
          delay={0}
          accentBg="var(--accent-secondary)"
        >
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {data.whatIsIt}
          </p>
        </AnalysisSection>
      )}

      {/* Section 2 — NEDEN ÖNEMLİ? */}
      {data.whyMatters?.length > 0 && (
        <AnalysisSection icon="⚡" title="Neden Önemli?" delay={100}>
          <ul className="space-y-2">
            {data.whyMatters.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: "var(--success)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </AnalysisSection>
      )}

      {/* Section 3 — NASIL GELDİK BURAYA? */}
      {data.timeline?.length > 0 && (
        <AnalysisSection icon="🕐" title="Nasıl Geldik Buraya?" delay={200}>
          <div className="relative pl-5">
            {/* Vertical line */}
            <div
              className="absolute left-1.75 top-1 bottom-1 w-0.5 rounded-full"
              style={{ background: "var(--border-subtle)" }}
            />
            <div className="space-y-4">
              {data.timeline.map((item, i) => (
                <div key={i} className="relative flex items-start gap-3">
                  <div
                    className="absolute -left-5 mt-1.5 w-2.5 h-2.5 rounded-full border-2 shrink-0"
                    style={{
                      borderColor: "var(--accent-primary)",
                      background:
                        i === 0 ? "var(--accent-primary)" : "var(--bg-card)",
                    }}
                  />
                  <div>
                    <p
                      className="text-xs font-bold"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {item.date}
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnalysisSection>
      )}

      {/* Section 4 — KİLİT İSİMLER */}
      {data.keyPlayers?.length > 0 && (
        <AnalysisSection icon="👥" title="Kilit İsimler" delay={300}>
          <div className="flex flex-wrap gap-2">
            {data.keyPlayers.map((player, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: "var(--bg-elevated)" }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {player.name}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  — {player.role}
                </span>
              </div>
            ))}
          </div>
        </AnalysisSection>
      )}

      {/* Section 5 — BUNDAN SONRA */}
      {data.whatNext?.length > 0 && (
        <AnalysisSection icon="🔮" title="Bundan Sonra Ne Olabilir?" delay={400}>
          <p
            className="text-[10px] font-medium mb-2 italic"
            style={{ color: "var(--text-muted)" }}
          >
            Bu senaryolar tahmine dayalıdır
          </p>
          <div className="space-y-2">
            {data.whatNext.map((scenario, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="text-sm mt-0.5 shrink-0"
                  style={{ color: "var(--text-muted)" }}
                >
                  →
                </span>
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {scenario}
                </span>
              </div>
            ))}
          </div>
        </AnalysisSection>
      )}

      {/* Footer */}
      <div className="pt-2 pb-1">
        <p className="mb-2 text-center text-[10px] text-[var(--text-muted)]">
          Kaynak araması ile desteklendi
          {isCached && " · Önbellekten"}
          {data.generatedAt && (
            <>
              {" · "}
              {new Date(data.generatedAt).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </>
          )}
        </p>
        <AiDisclosure sourceUrl={articleUrl} />
      </div>
    </div>
  );
}

// ── Reusable section wrapper ──
function AnalysisSection({ icon, title, delay = 0, accentBg, children }) {
  return (
    <div
      className="rounded-xl p-4 animate-fade-in-up"
      style={{
        background: accentBg
          ? `color-mix(in srgb, ${accentBg} 8%, var(--bg-elevated))`
          : "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{icon}</span>
        <h4
          className="text-xs font-black uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}

// ── Loading dots animation ──
function LoadingDots() {
  return (
    <span className="inline-flex ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full mx-0.5 animate-bounce"
          style={{
            background: "var(--text-muted)",
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
    </span>
  );
}
