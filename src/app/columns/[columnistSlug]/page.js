import { supabase } from "@/app/lib/supabase";
import { projectInfo } from "@/app/lib/authorConfig";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getColumnistAccent } from "@/app/lib/columnistConfig";
import ColumnistSignature from "@/app/components/ColumnistSignature";
import FollowColumnistButton from "@/app/components/FollowColumnistButton";

export async function generateMetadata({ params }) {
  const { columnistSlug } = await params;
  const { data } = await supabase
    .from("columnists")
    .select("name, title, expertise")
    .eq("slug", columnistSlug)
    .single();
  if (!data) return { title: "Yazar Bulunamadı" };
  return {
    title: `${data.name} — ${data.title} | HaberAI`,
    description: `${data.name}: ${data.expertise}`,
  };
}

export default async function ColumnistProfilePage({ params }) {
  const { columnistSlug } = await params;

  const { data: columnist } = await supabase
    .from("columnists")
    .select("*")
    .eq("slug", columnistSlug)
    .single();

  if (!columnist) notFound();

  const { data: columns } = await supabase
    .from("columns")
    .select("*")
    .eq("columnist_id", columnist.id)
    .order("published_at", { ascending: false });

  const totalViews =
    columns?.reduce((sum, col) => sum + (col.view_count || 0), 0) || 0;

  const initials = columnist.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const accent = getColumnistAccent(columnist.slug);
  const baseUrl = projectInfo.siteUrl;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: columnist.name,
    jobTitle: columnist.title,
    description: columnist.expertise,
    url: `${baseUrl}/columns/${columnist.slug}`,
  };

  return (
    <main className="page-shell">
      <div className="page-container max-w-4xl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <nav className="page-crumb" aria-label="Sayfa yolu">
          <Link href="/">Ana sayfa</Link>
          <span aria-hidden="true">/</span>
          <Link href="/columns">Köşe yazıları</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--text-secondary)]">{columnist.name}</span>
        </nav>

        <header
          className="relative mb-12 flex flex-col items-center gap-8 overflow-hidden border border-[var(--border-subtle)] p-8 text-center md:flex-row md:items-start md:p-10 md:text-left"
          style={{
            background: `linear-gradient(to bottom right, ${accent.light} 0%, var(--bg-card) 70%)`,
          }}
        >
          <div
            className="absolute left-0 right-0 top-0 h-1.5 opacity-80"
            style={{ backgroundColor: accent.primary }}
          />

          <div
            className="z-10 flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-[var(--bg-primary)] text-4xl font-black text-white shadow-md md:h-36 md:w-36"
            style={{ backgroundColor: accent.primary }}
          >
            {initials}
          </div>

          <div className="z-10 w-full flex-1">
            <div className="mb-2 flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <h1
                  className="mb-2 text-4xl font-bold text-[var(--text-primary)] md:text-5xl"
                  style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                >
                  {columnist.name}
                </h1>
                <p
                  className="mb-4 text-xl font-medium"
                  style={{ color: accent.primary }}
                >
                  {columnist.title}
                </p>
              </div>
              <div className="flex justify-center md:justify-end">
                <FollowColumnistButton
                  columnistSlug={columnist.slug}
                  columnistName={columnist.name}
                  accentColor={accent.primary}
                />
              </div>
            </div>

            <div className="mb-6 flex flex-wrap justify-center gap-2 md:justify-start">
              <span
                className="border bg-[var(--bg-elevated)] px-3 py-1 text-sm text-[var(--text-secondary)]"
                style={{ borderColor: accent.primary }}
              >
                {columnist.expertise}
              </span>
              <span className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 text-sm text-[var(--text-secondary)]">
                {columns?.length || 0} yazı
              </span>
              {totalViews > 0 && (
                <span className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 text-sm text-[var(--text-secondary)]">
                  {totalViews.toLocaleString("tr-TR")} okuma
                </span>
              )}
            </div>

            <p
              className="mb-8 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]"
              style={{ fontFamily: "var(--font-body), Georgia, serif" }}
            >
              {columnist.bio_long}
            </p>

            <div className="flex justify-center md:justify-start">
              <ColumnistSignature
                name={columnist.name}
                accentColor={accent.primary}
                size="lg"
              />
            </div>
          </div>
        </header>

        <section>
          <div className="page-section-label mb-8">
            <span>Tüm yazıları</span>
            <span className="page-section-rule" aria-hidden="true" />
          </div>

          <div className="space-y-4">
            {!columns || columns.length === 0 ? (
              <div className="page-empty">
                <h3>Henüz yazı yok</h3>
                <p>Bu yazarın yayınlanmış bir yazısı bulunmuyor.</p>
                <Link href="/columns" className="article-text-link accent">
                  Köşe yazılarına dön
                </Link>
              </div>
            ) : (
              columns.map((col) => (
                <article
                  key={col.id}
                  className="group border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 transition-colors hover:border-[var(--border-strong)]"
                  style={{ borderLeftWidth: 3, borderLeftColor: accent.primary }}
                >
                  <time
                    className="mb-2 block text-sm font-medium"
                    style={{ color: accent.primary }}
                  >
                    {new Date(col.published_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                  <h3 className="mb-3 text-2xl font-bold text-[var(--text-primary)]">
                    <Link
                      href={`/columns/${columnist.slug}/${col.slug}`}
                      className="no-underline transition-opacity hover:opacity-80"
                    >
                      {col.title}
                    </Link>
                  </h3>
                  <p className="mb-4 line-clamp-3 leading-relaxed text-[var(--text-secondary)]">
                    {col.content
                      ?.split("\n")
                      .find((l) => l.trim() && !l.startsWith("#"))
                      ?.trim()}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
                    <Link
                      href={`/columns/${columnist.slug}/${col.slug}`}
                      className="text-sm font-semibold no-underline transition-opacity hover:opacity-80"
                      style={{ color: accent.primary }}
                    >
                      Okumaya devam et →
                    </Link>
                    <div className="flex items-center gap-2">
                      {col.view_count > 0 && (
                        <span className="text-xs font-medium text-[var(--text-muted)]">
                          {col.view_count.toLocaleString("tr-TR")} okuma
                        </span>
                      )}
                      <span className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 text-xs text-[var(--text-muted)]">
                        {col.read_time_minutes} dk
                      </span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
