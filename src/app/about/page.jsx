import { author, projectInfo } from "@/app/lib/authorConfig";
import { siteConfig } from "@/app/lib/siteConfig";

export const metadata = {
  title: `Hakkımda · ${siteConfig.name}`,
  description: `${author.name} — ${author.bio}`,
};

// ── İkonlar ──────────────────────────────────────────────────────────────
function GithubIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
function LinkedinIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
function TwitterIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

// ── Kaç gün yayında ───────────────────────────────────────────────────────
function daysOnline(launchYear) {
  const launch = new Date(`${launchYear}-01-01`);
  return Math.floor((Date.now() - launch) / 86_400_000);
}

// ── Bölüm başlığı ─────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600 mb-4">
      {children}
    </p>
  );
}

// ── Kart wrapper ──────────────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
export default function AboutPage() {
  const initials = author.name.split(" ").map((w) => w[0]).slice(0, 2).join("");

  const socialLinks = [
    { key: "github",   href: author.links?.github,   label: "GitHub",      Icon: GithubIcon   },
    { key: "linkedin", href: author.links?.linkedin,  label: "LinkedIn",    Icon: LinkedinIcon },
    { key: "twitter",  href: author.links?.twitter,   label: "X / Twitter", Icon: TwitterIcon  },
    { key: "website",  href: author.links?.website,   label: "Website",     Icon: LinkIcon     },
  ].filter((l) => l.href);

  const days = daysOnline(projectInfo.launchYear);

  const stats = (projectInfo.stats || []).map((s) =>
    s.value === null ? { ...s, value: `${days} gün` } : s
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <div className="max-w-2xl px-4 py-16 mx-auto space-y-5 sm:px-6">

        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-600">
          Hakkımda
        </p>

        {/* ══ 1. PROFİL ══════════════════════════════════════════════════ */}
        <Card>
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
          <div className="px-8 pt-8 pb-7">
            <div className="flex items-start gap-5">
              {author.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={author.avatar} alt={author.name}
                  className="object-cover w-20 h-20 border shadow-sm rounded-2xl shrink-0 border-stone-200 dark:border-stone-700" />
              ) : (
                <div className="flex items-center justify-center w-20 h-20 shadow-sm rounded-2xl shrink-0 bg-stone-900 dark:bg-amber-400">
                  <span className="text-2xl font-black text-white dark:text-stone-900"
                    style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
                    {initials}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0 pt-1.5">
                <h1 className="text-2xl font-black leading-tight tracking-tight text-stone-900 dark:text-white"
                  style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
                  {author.name}
                </h1>
                {author.title && (
                  <p className="mt-1 text-xs font-semibold tracking-wide text-amber-600 dark:text-amber-400">
                    {author.title}
                  </p>
                )}
              </div>
            </div>
            {author.bio && (
              <p className="pl-4 mt-6 text-sm leading-7 border-l-2 text-stone-600 dark:text-stone-300 border-amber-400">
                {author.bio}
              </p>
            )}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {socialLinks.map(({ key, href, label, Icon }) => (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold uppercase tracking-widest rounded-xl
                      bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400
                      hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900
                      transition-all duration-150">
                    <Icon />{label}
                  </a>
                ))}
              </div>
            )}
            {author.email && (
              <a href={`mailto:${author.email}`}
                className="inline-flex items-center gap-2 mt-4 text-xs transition-colors text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-white">
                <MailIcon />{author.email}
              </a>
            )}
          </div>
        </Card>

        {/* ══ 2. İSTATİSTİKLER ══════════════════════════════════════════ */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}
                className="px-5 py-5 text-center bg-white border shadow-sm dark:bg-stone-900 rounded-2xl border-stone-200 dark:border-stone-800">
                <p className="text-2xl font-black text-stone-900 dark:text-white"
                  style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
                  {s.value}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-600 mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ══ 3. ÖZELLİKLER ════════════════════════════════════════════ */}
        {projectInfo.features?.length > 0 && (
          <Card>
            <div className="px-8 py-6">
              <SectionLabel>Özellikler</SectionLabel>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {projectInfo.features.map((f) => (
                  <div key={f.label}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
                    <span className="text-lg leading-none mt-0.5">{f.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-stone-800 dark:text-stone-100">{f.label}</p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* ══ 4. PROJE ══════════════════════════════════════════════════ */}
        <Card>
          <div className="px-8 py-6 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionLabel>Proje</SectionLabel>
                <h2 className="text-xl font-black leading-tight text-stone-900 dark:text-white"
                  style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
                  {projectInfo.name}
                </h2>
                {projectInfo.tagline && (
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{projectInfo.tagline}</p>
                )}
              </div>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                {projectInfo.launchYear}
              </span>
            </div>
            {projectInfo.description && (
              <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                {projectInfo.description}
              </p>
            )}
          </div>

          {/* Tech stack */}
          {projectInfo.techStack?.length > 0 && (
            <div className="px-8 py-6 border-b border-stone-100 dark:border-stone-800">
              <SectionLabel>Teknolojiler</SectionLabel>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {projectInfo.techStack.map((t) => (
                  <div key={t.label}
                    className="flex items-start gap-3 p-3 border rounded-xl bg-stone-50 dark:bg-stone-800/60 border-stone-100 dark:border-stone-800">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-stone-800 dark:text-stone-100">{t.label}</p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-4 bg-stone-50 dark:bg-stone-800/30">
            <p className="text-[10px] text-stone-400 dark:text-stone-600">
              {projectInfo.launchYear} yılından beri yayında
            </p>
            {projectInfo.openSource && projectInfo.repoUrl ? (
              <a href={projectInfo.repoUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors">
                <GithubIcon />Kaynak Kod
              </a>
            ) : (
              <span className="text-[10px] text-stone-400 dark:text-stone-600">Kapalı kaynak</span>
            )}
          </div>
        </Card>

        {/* ══ 5. GİZLİLİK ══════════════════════════════════════════════ */}
        {projectInfo.privacy && (
          <Card>
            <div className="px-8 py-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldIcon />
                <SectionLabel>Gizlilik & Reklamlar</SectionLabel>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold
                  ${projectInfo.privacy.adsEnabled
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"}`}>
                  <span>{projectInfo.privacy.adsEnabled ? "⚠️" : "✓"}</span>
                  {projectInfo.privacy.adsEnabled ? "Reklam içerir" : "Reklam yok"}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold
                  ${projectInfo.privacy.analyticsEnabled
                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"}`}>
                  <span>{projectInfo.privacy.analyticsEnabled ? "📊" : "✓"}</span>
                  {projectInfo.privacy.analyticsEnabled
                    ? `Analitik: ${projectInfo.privacy.analyticsTool || "aktif"}`
                    : "Analitik yok"}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold
                  ${projectInfo.privacy.cookiesUsed
                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"}`}>
                  <span>{projectInfo.privacy.cookiesUsed ? "🍪" : "✓"}</span>
                  {projectInfo.privacy.cookiesUsed ? "Çerez kullanır" : "Çerez yok"}
                </span>
              </div>
              {projectInfo.privacy.dataCollected && (
                <p className="px-4 py-3 text-xs leading-relaxed border text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50 rounded-xl border-stone-100 dark:border-stone-800">
                  {projectInfo.privacy.dataCollected}
                </p>
              )}
            </div>
          </Card>
        )}

        {/* ══ 6. İLETİŞİM ══════════════════════════════════════════════ */}
        {projectInfo.contact && (
          <Card>
            <div className="px-8 py-6">
              <SectionLabel>İletişim</SectionLabel>
              {projectInfo.contact.note && (
                <p className="mb-5 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                  {projectInfo.contact.note}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                {projectInfo.contact.email && (
                  <a href={`mailto:${projectInfo.contact.email}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold
                      bg-stone-900 dark:bg-white text-white dark:text-stone-900
                      hover:bg-stone-700 dark:hover:bg-stone-100 transition-colors">
                    <MailIcon />
                    E-posta Gönder
                  </a>
                )}
                {projectInfo.contact.formUrl && (
                  <a href={projectInfo.contact.formUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold
                      bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300
                      hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                    <LinkIcon />
                    İletişim Formu
                  </a>
                )}
              </div>
            </div>
          </Card>
        )}

        <p className="text-center text-[11px] text-stone-400 dark:text-stone-600 pb-4">
          Yapay zeka destekli, bağımsız bir haber deneyimi.
        </p>

      </div>
    </div>
  );
}