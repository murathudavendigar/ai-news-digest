"use client";

import PushNotificationToggle from "@/app/components/PushNotificationToggle";
import { CATEGORIES, CRON, formatCronTimeLocal } from "@/app/lib/siteConfig";
import { useUserPreferences } from "@/app/lib/useUserPreferences";
import { useTheme } from "next-themes";
import Link from "next/link";

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
        <p className="text-[11px] font-black text-stone-400 uppercase tracking-widest">
          {title}
        </p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function OptionRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-stone-100 dark:border-stone-800 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
          {label}
        </p>
        {description && (
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { prefs, setPrefs, mounted } = useUserPreferences();
  const { theme, setTheme } = useTheme();

  if (!mounted) {
    return (
      <div className="px-4 py-8 mx-auto max-w-2xl sm:px-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse"
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
    <div className="px-4 py-8 mx-auto max-w-2xl sm:px-6 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-xs text-stone-500 dark:text-stone-400">
        <Link
          href="/"
          className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
          Anasayfa
        </Link>
        <span>›</span>
        <span className="font-medium text-stone-700 dark:text-stone-300">
          Ayarlar
        </span>
      </div>

      <div className="mb-8">
        <h1
          className="text-3xl font-black text-stone-900 dark:text-stone-50"
          style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
          ⚙️ Ayarlar
        </h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Tercihler bu tarayıcıda saklanır.
        </p>
      </div>

      <div className="space-y-6">
        {/* ─── Tercihli Kategoriler ─────────────────────────────────── */}
        <Section title="Tercihli Kategoriler">
          <p className="mb-4 text-xs text-stone-500 dark:text-stone-400">
            Seçili kategorilerdeki haberler ana akışta önce görünür.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {CATEGORIES.map((cat) => {
              const active = prefs.preferredCategories.includes(cat.slug);
              return (
                <button
                  key={cat.slug}
                  onClick={() => toggleCategory(cat.slug)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    active
                      ? "bg-amber-400/15 border-amber-400/50 text-amber-700 dark:text-amber-300"
                      : "bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400"
                  }`}>
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.title}</span>
                  {active && <span className="ml-auto text-amber-500">✓</span>}
                </button>
              );
            })}
          </div>
          {prefs.preferredCategories.length > 0 && (
            <p className="mt-3 text-[11px] text-stone-400">
              {prefs.preferredCategories.length} kategori seçili — bu
              kategoriler Ana Sayfa&apos;da önce gösterilir.
            </p>
          )}
        </Section>

        {/* ─── Bildirimler ──────────────────────────────────────────── */}
        <Section title="🔔 Bildirimler">
          <OptionRow
            label={`Günlük haber özeti (her akşam ${formatCronTimeLocal(CRON.PUSH_NOTIFY_UTC_HOUR)})`}
            description="Manşetler ve en önemli 3 haber başlığı sana gelsin">
            <PushNotificationToggle compact />
          </OptionRow>
        </Section>

        {/* Okuma İstatistikleri */}
        <Section title="📊 Okuma Geçmişi & İstatistikler">
          <Link
            href="/history"
            className="flex items-center justify-between p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm hover:border-amber-400 transition-colors"
          >
            <div className="flex flex-col">
              <span className="text-sm font-bold text-stone-900 dark:text-white">İstatistiklerini Gör</span>
              <span className="text-xs text-stone-500">Hangi habere ne kadar vakit ayırdığını keşfet</span>
            </div>
            <span className="text-stone-400">→</span>
          </Link>
        </Section>

        {/* Görüntüleme */}
        <Section title="Görüntüleme">
          <OptionRow
            label="Okunmuş haberleri soluk göster"
            description="Tıkladığınız haberler %60 opaklıkla gösterilir">
            <button
              onClick={() =>
                setPrefs((p) => ({
                  ...p,
                  dimReadArticles: !p.dimReadArticles,
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs.dimReadArticles
                  ? "bg-amber-400"
                  : "bg-stone-300 dark:bg-stone-600"
              }`}>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  prefs.dimReadArticles ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </OptionRow>
        </Section>

        {/* ─── AI Özet Uzunluğu ─────────────────────────────────────── */}
        <Section title="AI Özet Uzunluğu">
          <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">
            Haber detay sayfasındaki AI özetinin uzunluğunu belirler.
          </p>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "short", label: "Kısa", desc: "2-3 cümle" },
              { value: "normal", label: "Normal", desc: "4-5 cümle" },
              { value: "detailed", label: "Detaylı", desc: "Tam analiz" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  setPrefs((p) => ({ ...p, summaryLength: opt.value }))
                }
                className={`flex flex-col items-center px-5 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  prefs.summaryLength === opt.value
                    ? "bg-amber-400/15 border-amber-400/50 text-amber-700 dark:text-amber-300"
                    : "bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400"
                }`}>
                {opt.label}
                <span className="text-[10px] font-normal opacity-70 mt-0.5">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* ─── Tema ─────────────────────────────────────────────────── */}
        <Section title="Tema">
          <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">
            Uygulamanın renk temasını seçin.
          </p>
          <div className="flex gap-2 flex-wrap">
            {[
              {
                value: "system",
                label: "Sistem",
                icon: "💻",
                desc: "Cihaz ayarını izle",
              },
              {
                value: "light",
                label: "Açık",
                icon: "☀️",
                desc: "Her zaman açık",
              },
              {
                value: "dark",
                label: "Koyu",
                icon: "🌙",
                desc: "Her zaman koyu",
              },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex flex-col items-center px-5 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  theme === opt.value
                    ? "bg-amber-400/15 border-amber-400/50 text-amber-700 dark:text-amber-300"
                    : "bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400"
                }`}>
                <span className="text-lg mb-1">{opt.icon}</span>
                {opt.label}
                <span className="text-[10px] font-normal opacity-70 mt-0.5">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* ─── Sıfırla ──────────────────────────────────────────────── */}
        <div className="flex justify-between items-center pt-2">
          <p className="text-xs text-stone-400">
            Tüm tercihler cihazınızda saklanır, hesap gerekmez.
          </p>
          <button
            onClick={resetAll}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
            Sıfırla
          </button>
        </div>
      </div>
    </div>
  );
}
