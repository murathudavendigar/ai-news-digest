"use client";

import PushNotificationToggle from "@/app/components/PushNotificationToggle";
import { CATEGORIES, CRON, formatCronTimeLocal } from "@/app/lib/siteConfig";
import { useUserPreferences } from "@/app/lib/useUserPreferences";
import { useTheme } from "next-themes";
import Link from "next/link";

function Section({ title, children }) {
  return (
    <section className="page-panel">
      <div className="page-panel-head">
        <p>{title}</p>
      </div>
      <div className="page-panel-body">{children}</div>
    </section>
  );
}

function OptionRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ChoiceButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center border px-5 py-3 text-sm font-semibold transition-colors ${
        active
          ? "border-[var(--accent-brand)] bg-[color-mix(in_srgb,var(--accent-brand)_14%,transparent)] text-[var(--text-primary)]"
          : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
      }`}
    >
      {children}
    </button>
  );
}

export default function SettingsPage() {
  const { prefs, setPrefs, mounted } = useUserPreferences();
  const { theme, setTheme } = useTheme();

  if (!mounted) {
    return (
      <div className="page-shell">
        <div className="page-container-narrow space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
            />
          ))}
        </div>
      </div>
    );
  }

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

  const resetAll = () => {
    setPrefs({
      preferredCategories: [],
      language: "tr",
      summaryLength: "normal",
      dimReadArticles: true,
    });
  };

  return (
    <div className="page-shell">
      <div className="page-container-narrow pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <nav className="page-crumb" aria-label="Sayfa yolu">
          <Link href="/">Ana sayfa</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--text-secondary)]">Ayarlar</span>
        </nav>

        <header className="page-masthead">
          <p className="page-masthead-kicker">Tercihler</p>
          <h1 className="page-masthead-title">Ayarlar</h1>
          <p className="page-masthead-lede">
            Tercihler bu tarayıcıda saklanır — hesap gerekmez.
          </p>
        </header>

        <div className="space-y-5">
          <Section title="Tercihli kategoriler">
            <p className="mb-4 text-xs text-[var(--text-muted)]">
              Seçili kategorilerdeki haberler ana akışta önce görünür.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((cat) => {
                const active = prefs.preferredCategories.includes(cat.slug);
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => toggleCategory(cat.slug)}
                    className={`border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                      active
                        ? "border-[var(--accent-brand)] bg-[color-mix(in_srgb,var(--accent-brand)_14%,transparent)] text-[var(--text-primary)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate">{cat.title}</span>
                      {active && (
                        <span className="text-[var(--accent-brand)]">✓</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {prefs.preferredCategories.length > 0 && (
              <p className="mt-3 text-[11px] text-[var(--text-muted)]">
                {prefs.preferredCategories.length} kategori seçili
              </p>
            )}
          </Section>

          <Section title="Bildirimler">
            <div className="mb-4 border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Ne gelir?
              </p>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                <li>
                  · Her akşam ~
                  {formatCronTimeLocal(CRON.PUSH_NOTIFY_UTC_HOUR)} günün özeti
                </li>
                <li>· Önemli son dakika (seyrek)</li>
                <li>· Tıkla → /digest veya ilgili haber</li>
              </ul>
            </div>
            <OptionRow
              label="Günlük haber özeti"
              description={`Her akşam ${formatCronTimeLocal(CRON.PUSH_NOTIFY_UTC_HOUR)} civarı. İstediğin an kapatabilirsin.`}
            >
              <PushNotificationToggle compact />
            </OptionRow>
          </Section>

          <Section title="Okuma geçmişi">
            <Link
              href="/history"
              className="flex items-center justify-between border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 no-underline transition-colors hover:border-[var(--border-strong)]"
            >
              <div>
                <span className="block text-sm font-bold text-[var(--text-primary)]">
                  İstatistiklerini gör
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  Hangi habere ne kadar vakit ayırdığını keşfet
                </span>
              </div>
              <span className="text-[var(--text-muted)]">→</span>
            </Link>
          </Section>

          <Section title="Görüntüleme">
            <OptionRow
              label="Okunmuş haberleri soluk göster"
              description="Tıkladığın haberler %60 opaklıkla gösterilir"
            >
              <button
                type="button"
                aria-pressed={prefs.dimReadArticles}
                onClick={() =>
                  setPrefs((p) => ({
                    ...p,
                    dimReadArticles: !p.dimReadArticles,
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  prefs.dimReadArticles
                    ? "bg-[var(--accent-brand)]"
                    : "bg-[var(--border-strong)]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    prefs.dimReadArticles ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </OptionRow>
          </Section>

          <Section title="AI özet uzunluğu">
            <p className="mb-3 text-xs text-[var(--text-muted)]">
              Haber detayındaki AI özetinin uzunluğunu belirler.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "short", label: "Kısa", desc: "2-3 cümle" },
                { value: "normal", label: "Normal", desc: "4-5 cümle" },
                { value: "detailed", label: "Detaylı", desc: "Tam analiz" },
              ].map((opt) => (
                <ChoiceButton
                  key={opt.value}
                  active={prefs.summaryLength === opt.value}
                  onClick={() =>
                    setPrefs((p) => ({ ...p, summaryLength: opt.value }))
                  }
                >
                  {opt.label}
                  <span className="mt-0.5 text-[10px] font-normal opacity-70">
                    {opt.desc}
                  </span>
                </ChoiceButton>
              ))}
            </div>
          </Section>

          <Section title="Tema">
            <p className="mb-3 text-xs text-[var(--text-muted)]">
              Uygulamanın renk temasını seç.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "system", label: "Sistem", desc: "Cihaz ayarı" },
                { value: "light", label: "Açık", desc: "Her zaman açık" },
                { value: "dark", label: "Koyu", desc: "Her zaman koyu" },
              ].map((opt) => (
                <ChoiceButton
                  key={opt.value}
                  active={theme === opt.value}
                  onClick={() => setTheme(opt.value)}
                >
                  {opt.label}
                  <span className="mt-0.5 text-[10px] font-normal opacity-70">
                    {opt.desc}
                  </span>
                </ChoiceButton>
              ))}
            </div>
          </Section>

          <Section title="Uygulama (PWA)">
            <p className="mb-3 text-xs leading-relaxed text-[var(--text-muted)]">
              HaberAI ana ekrana eklenebilir. Çevrimdışında özet, kayıtlar ve
              son açılan sayfalar önbellekten açılır.
            </p>
            <ul className="mb-4 space-y-1.5 text-xs text-[var(--text-secondary)]">
              <li>· iPhone: Safari → Paylaş → Ana Ekrana Ekle</li>
              <li>· Android: tarayıcı menüsü → Uygulamayı yükle / Ana ekrana ekle</li>
              <li>· Bildirimler için izin vermen gerekir (yukarıdaki bölüm)</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const ios =
                    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
                    (navigator.platform === "MacIntel" &&
                      navigator.maxTouchPoints > 1);
                  if (ios) {
                    alert(
                      "iPhone / iPad:\n1. Safari’de bu siteyi aç\n2. Paylaş düğmesine dokun\n3. “Ana Ekrana Ekle”yi seç",
                    );
                    return;
                  }
                  if (window.deferredPrompt) {
                    window.deferredPrompt.prompt();
                    return;
                  }
                  alert("Tarayıcı menüsünden Ana ekrana ekle");
                }}
                className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                Ana ekrana ekle
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem("haberai:pwa-install-snooze");
                    localStorage.removeItem("haberai:pwa-install-dismissed");
                  } catch {}
                  alert("Kurulum uyarısı sıfırlandı — sayfayı yenile.");
                }}
                className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                Uyarıyı yeniden göster
              </button>
            </div>
          </Section>

          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-xs text-[var(--text-muted)]">
              Tüm tercihler cihazında saklanır.
            </p>
            <button
              type="button"
              onClick={resetAll}
              className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Sıfırla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
