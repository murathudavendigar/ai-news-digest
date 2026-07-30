"use client";

import { useEffect, useState, useRef } from "react";
import AiDisclosure from "./AiDisclosure";

function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-[var(--bg-elevated)] ${className}`} />
  );
}

function estimateMinutes(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[…\.]+$/g, "")
    .trim();
}

/** RSS dek ile AI özeti aynıysa tekrarı gizle */
function isDuplicateOfDek(summary, description) {
  if (!summary || !description) return false;
  const a = normalizeText(summary);
  const b = normalizeText(description);
  if (!a || !b) return false;
  if (a === b) return true;
  // Kısa RSS özeti AI metninin başına yapıştırılmışsa
  const short = a.length <= b.length ? a : b;
  const long = a.length > b.length ? a : b;
  if (short.length >= 40 && long.includes(short)) return true;
  // İlk ~120 karakter örtüşmesi
  return a.slice(0, 120) === b.slice(0, 120);
}

const FAILED_SUMMARIES = new Set([
  "özet oluşturulamadı.",
  "özet oluşturulamadı",
]);

/**
 * Editorial reading block: AI deck + why + bullets + body paragraphs.
 * Üstteki article-dek (RSS description) ile aynı metni tekrarlamaz.
 */
export default function DetailPageSummary({ url, description }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (!url || fetched.current) return;
    fetched.current = true;

    let isMounted = true;
    const doFetch = async () => {
      setLoading(true);
      setFailed(false);
      try {
        const params = new URLSearchParams({ url });
        if (description?.trim()) {
          params.set("hint", description.trim().slice(0, 4000));
        }
        const r = await fetch(`/api/reader?${params.toString()}`);
        const result = await r.json();
        if (!isMounted) return;
        if (result?.error && !result?.summary && !result?.bodyText) {
          setFailed(true);
          setData(null);
        } else {
          setData(result);
        }
      } catch {
        if (isMounted) {
          setFailed(true);
          setData(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    doFetch();
    return () => {
      isMounted = false;
    };
  }, [url, description]);

  if (!url) {
    // Kaynak yok — üstteki dek zaten description gösteriyorsa burada tekrarlama
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="article-deck">
          <Skeleton className="mb-4 h-3 w-24" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );
  }

  const rawSummary = data?.summary?.trim() || "";
  const aiSummary =
    rawSummary && !FAILED_SUMMARIES.has(rawSummary.toLowerCase())
      ? rawSummary
      : null;

  // RSS dek ile aynıysa "Kısa okuma"da gösterme
  const summary =
    aiSummary && !isDuplicateOfDek(aiSummary, description) ? aiSummary : null;

  const whyMatters = data?.whyMatters || null;
  const bullets = Array.isArray(data?.bullets) ? data.bullets : [];
  const paragraphs =
    data?.paragraphs?.length > 0
      ? data.paragraphs
      : data?.bodyText
        ? data.bodyText
            .split(/\n{2,}|\n/)
            .map((p) => p.trim())
            .filter((p) => p.length > 40)
        : [];

  const minutes =
    data?.readingMinutes ||
    estimateMinutes(
      [data?.bodyText, summary, whyMatters, ...bullets]
        .filter(Boolean)
        .join(" "),
    );

  const hasDeck = Boolean(summary || whyMatters || bullets.length > 0);

  if (!hasDeck && paragraphs.length === 0) {
    if (failed) {
      return (
        <p className="text-sm text-[var(--text-muted)]">
          Haber metni şu an çekilemedi. Kaynak bağlantısından okuyabilirsin.
        </p>
      );
    }
    if (data?.summarySkipped || data?.scrapingFailed) {
      return (
        <p className="text-sm text-[var(--text-muted)]">
          Bu haber için yeterli metin yok; AI özeti üretilmedi. Kaynak
          bağlantısından okuyabilirsin.
        </p>
      );
    }
    // Sadece üstteki RSS dek var — tekrar yok
    return null;
  }

  return (
    <div className="space-y-8">
      {hasDeck && (
        <aside className="article-deck" aria-label="Kısa okuma">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="article-kicker">Kısa okuma</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              ~{minutes} dk
            </p>
          </div>

          {summary && (
            <p
              className="article-deck-summary"
              style={{ fontFamily: "var(--font-body), Georgia, serif" }}
            >
              {summary}
            </p>
          )}

          {whyMatters && (
            <p className="article-why">
              <span>Neden önemli — </span>
              {whyMatters}
            </p>
          )}

          {bullets.length > 0 && (
            <ul className="article-bullets">
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </aside>
      )}

      {paragraphs.length > 0 && (
        <div className="article-prose">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      <AiDisclosure
        sourceUrl={data?.sourceUrl || url}
        sourceName={data?.sourceName}
      />
    </div>
  );
}
