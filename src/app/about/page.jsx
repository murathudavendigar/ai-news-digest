import { author, projectInfo } from "@/app/lib/authorConfig";
import { siteConfig } from "@/app/lib/siteConfig";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: `Hakkında · ${siteConfig.name}`,
  description: `${siteConfig.name} — ${projectInfo.tagline}. ${author.name}.`,
  alternates: { canonical: `${siteConfig.url}/about` },
};

function GithubIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
function LinkedinIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
function TwitterIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function daysOnline(launchYear) {
  const launch = new Date(`${launchYear}-01-01T00:00:00Z`);
  return Math.max(1, Math.floor((Date.now() - launch.getTime()) / 86_400_000));
}

function SectionLabel({ children }) {
  return (
    <p className="page-masthead-kicker mb-4">{children}</p>
  );
}

export default function AboutPage() {
  const initials = author.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  const socialLinks = [
    { key: "github", href: author.links?.github, label: "GitHub", Icon: GithubIcon },
    { key: "linkedin", href: author.links?.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
    { key: "twitter", href: author.links?.twitter, label: "X", Icon: TwitterIcon },
    { key: "website", href: author.links?.website, label: "Website", Icon: LinkIcon },
  ].filter((l) => l.href);

  const days = daysOnline(projectInfo.launchYear);
  const stats = (projectInfo.stats || []).map((s) =>
    s.value === null ? { ...s, value: `${days}` } : s,
  );

  return (
    <div className="page-shell">
      <div className="page-container-narrow">
        <nav className="page-crumb" aria-label="Konum">
          <Link href="/">Ana sayfa</Link>
          <span aria-hidden>/</span>
          <span>Hakkında</span>
        </nav>

        {/* Marka masthead */}
        <header className="page-masthead">
          <div className="mb-5 flex items-center gap-4">
            <Image
              src="/icon-192.png"
              alt=""
              width={56}
              height={56}
              className="rounded-xl border border-[var(--border-subtle)]"
              priority
            />
            <div>
              <p className="page-masthead-kicker mb-0">Bağımsız · reklamsız</p>
              <h1 className="page-masthead-title">
                {siteConfig.logoPrimary}
                <span className="text-[var(--accent-brand)]">{siteConfig.logoAccent}</span>
              </h1>
            </div>
          </div>
          <p className="page-masthead-lede">{projectInfo.description}</p>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            {siteConfig.url.replace(/^https?:\/\//, "")} · v{siteConfig.version}
          </p>
        </header>

        {/* İlkeler */}
        {projectInfo.principles?.length > 0 && (
          <section className="mb-10">
            <SectionLabel>İlkeler</SectionLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              {projectInfo.principles.map((p) => (
                <div
                  key={p.title}
                  className="border-t border-[var(--border-subtle)] pt-3"
                >
                  <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--text-primary)]">
                    {p.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Nasıl çalışır */}
        {projectInfo.methodology?.length > 0 && (
          <section className="mb-10">
            <SectionLabel>Nasıl çalışır?</SectionLabel>
            <ol className="space-y-4">
              {projectInfo.methodology.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    className="mt-0.5 w-7 shrink-0 font-[family-name:var(--font-display)] text-lg font-black text-[var(--accent-brand)]"
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-primary)]">
                      {step.title}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-l-2 border-[var(--accent-brand)] pl-3 text-xs leading-relaxed text-[var(--text-muted)]">
              Yapay zeka çıktıları yardımcı içeriktir; doğrulama için her zaman
              kaynak yayını kontrol edin.
            </p>
          </section>
        )}

        {/* Stats */}
        {stats.length > 0 && (
          <section className="mb-10 grid grid-cols-2 gap-px overflow-hidden border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-[var(--bg-primary)] px-4 py-5 text-center"
              >
                <p className="font-[family-name:var(--font-display)] text-2xl font-black text-[var(--text-primary)]">
                  {s.value}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  {s.label}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Özellikler */}
        {projectInfo.features?.length > 0 && (
          <section className="mb-10">
            <SectionLabel>Ne sunuyor?</SectionLabel>
            <ul className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              {projectInfo.features.map((f) => (
                <li
                  key={f.label}
                  className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <span className="w-40 shrink-0 text-sm font-bold text-[var(--text-primary)]">
                    {f.label}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {f.desc}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Kurucu */}
        <section className="mb-10 border border-[var(--border-subtle)] p-6 sm:p-8">
          <SectionLabel>Kim yapıyor?</SectionLabel>
          <div className="flex items-start gap-4">
            {author.avatar ? (
              <Image
                src={author.avatar}
                alt={author.name}
                width={72}
                height={72}
                className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-[var(--text-primary)]">
                <span className="font-[family-name:var(--font-display)] text-xl font-black text-[var(--bg-primary)]">
                  {initials}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-black text-[var(--text-primary)]">
                {author.name}
              </h2>
              {author.title && (
                <p className="mt-0.5 text-xs font-semibold text-[var(--accent-brand)]">
                  {author.title}
                </p>
              )}
              {author.bio && (
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {author.bio}
                </p>
              )}
            </div>
          </div>
          {socialLinks.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {socialLinks.map(({ key, href, label, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-[var(--border-subtle)] px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                >
                  <Icon />
                  {label}
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Tech */}
        {projectInfo.techStack?.length > 0 && (
          <section className="mb-10">
            <SectionLabel>Teknoloji</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {projectInfo.techStack.map((t) => (
                <div key={t.label} className="flex gap-3">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-brand)]"
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      {t.label}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gizlilik */}
        {projectInfo.privacy && (
          <section className="mb-10">
            <SectionLabel>Gizlilik</SectionLabel>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="border border-[var(--border-subtle)] px-3 py-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
                {projectInfo.privacy.adsEnabled ? "Reklam var" : "Reklam yok"}
              </span>
              <span className="border border-[var(--border-subtle)] px-3 py-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
                {projectInfo.privacy.analyticsEnabled
                  ? `Analitik: ${projectInfo.privacy.analyticsTool || "aktif"}`
                  : "Üçüncü taraf analitik yok"}
              </span>
              <span className="border border-[var(--border-subtle)] px-3 py-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
                {projectInfo.privacy.cookiesUsed
                  ? "Çerez kullanır"
                  : "Takip çerezi yok"}
              </span>
            </div>
            {projectInfo.privacy.dataCollected && (
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {projectInfo.privacy.dataCollected}
              </p>
            )}
          </section>
        )}

        {/* İletişim */}
        {projectInfo.contact && (
          <section className="mb-10 border-t border-[var(--border-subtle)] pt-8">
            <SectionLabel>İletişim</SectionLabel>
            {projectInfo.contact.note && (
              <p className="mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
                {projectInfo.contact.note}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {projectInfo.contact.email && (
                <a
                  href={`mailto:${projectInfo.contact.email}`}
                  className="inline-flex items-center gap-2 bg-[var(--text-primary)] px-4 py-2.5 text-xs font-bold text-[var(--bg-primary)] transition-opacity hover:opacity-90"
                >
                  <MailIcon />
                  E-posta
                </a>
              )}
              <Link
                href="/digest"
                className="inline-flex items-center gap-2 border border-[var(--border-subtle)] px-4 py-2.5 text-xs font-bold text-[var(--text-primary)] transition-colors hover:border-[var(--text-primary)]"
              >
                Günün özetine git →
              </Link>
            </div>
          </section>
        )}

        <p className="pb-2 text-center text-[11px] text-[var(--text-muted)]">
          {siteConfig.creditLine} · {projectInfo.launchYear}
          ’den beri
        </p>
      </div>
    </div>
  );
}
