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

/**
 * Editorial reading block: AI deck + why + bullets + body paragraphs.
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
        const r = await fetch(`/api/reader?url=${encodeURIComponent(url)}`);
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
  }, [url]);

  if (!url) {
    if (!description) return null;
    return (
      <div className="article-prose">
        <p>{description}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="article-deck">
          <Skeleton className="h-3 w-24 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
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

  const summary = data?.summary || description;
  const whyMatters = data?.whyMatters || null;
  const bullets = data?.bullets || [];
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
    estimateMinutes(data?.bodyText || summary || description || "");

  if (!summary && bullets.length === 0 && paragraphs.length === 0) {
    if (failed) {
      return (
        <p className="text-sm text-[var(--text-muted)]">
          Haber metni şu an çekilemedi. Kaynak bağlantısından okuyabilirsin.
        </p>
      );
    }
    return null;
  }

  return (
    <div className="space-y-8">
      {(summary || whyMatters || bullets.length > 0) && (
        <aside className="article-deck" aria-label="Haber özeti">
          <div className="flex items-center justify-between gap-3 mb-3">
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

      {!paragraphs.length && description && description !== summary && (
        <div className="article-prose">
          <p>{description}</p>
        </div>
      )}

      <AiDisclosure
        sourceUrl={data?.sourceUrl || url}
        sourceName={data?.sourceName}
      />
    </div>
  );
}
