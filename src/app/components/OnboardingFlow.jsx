"use client";

import { CITIES } from "@/app/lib/cityConfig";
import { CATEGORIES } from "@/app/lib/siteConfig";
import { DEFAULT_PREFERENCES, savePrefs } from "@/app/lib/useUserPreferences";
import { useRef, useState } from "react";

export const ONBOARDING_KEY = "haberai:onboarding-v1";
const CITY_KEY = "haberai:city";

const SUGGESTED_TOPICS = [
  "Yapay Zeka",
  "Bitcoin",
  "Dolar",
  "Enflasyon",
  "Konut",
  "Seçim",
  "NATO",
  "Avrupa Birliği",
  "Uzay",
  "Deprem",
  "Fenerbahçe",
  "Galatasaray",
  "Beşiktaş",
  "Milli Takım",
  "Sağlık",
  "İklim",
  "Enerji",
  "Savunma Sanayii",
];

/* ─── Ortak butonlar ──────────────────────────────────────────────────── */
function PrimaryBtn({ onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]">
      {children}
    </button>
  );
}

function SkipBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2.5 text-[11px] font-bold uppercase tracking-widest text-stone-600 hover:text-stone-400 transition-colors mt-1">
      Atla →
    </button>
  );
}

/* ─── Step 0: Karşılama ───────────────────────────────────────────────── */
function WelcomeStep({ onStart }) {
  return (
    <div className="text-center py-10 flex flex-col items-center">
      <div
        className="text-6xl sm:text-7xl font-black text-white mb-6 select-none"
        style={{
          fontFamily: "var(--font-display, Georgia, serif)",
          animation: "onbScaleIn 0.6s cubic-bezier(0.22,1,0.36,1) both",
        }}>
        Haber<span className="text-amber-400">AI</span>
      </div>
      <h1
        className="text-2xl font-black text-white mb-3"
        style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
        Hoşgeldin!
      </h1>
      <p className="text-stone-400 text-sm leading-relaxed mb-10 max-w-xs">
        Yapay zeka destekli haberleri kişiselleştirmek için birkaç küçük tercih
        yapalım. 2 dakikadan az sürer.
      </p>
      <div className="w-full max-w-xs space-y-2">
        <PrimaryBtn onClick={onStart}>Başlayalım →</PrimaryBtn>
      </div>
      <p className="text-[10px] text-stone-700 mt-5">
        Her zaman Ayarlar&apos;dan değiştirebilirsin
      </p>
    </div>
  );
}

/* ─── Step 1: Kategoriler ─────────────────────────────────────────────── */
function CategoryStep({ selected, toggle, onNext, onSkip }) {
  return (
    <div className="py-4">
      <h2
        className="text-xl font-black text-white mb-1"
        style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
        Hangi konular ilgini çekiyor?
      </h2>
      <p className="text-stone-500 text-xs mb-5">
        Seçili kategorilerdeki haberler sana önce gösterilir
      </p>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {CATEGORIES.map((cat) => {
          const active = selected.includes(cat.slug);
          return (
            <button
              key={cat.slug}
              onClick={() => toggle(cat.slug)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left transition-all active:scale-[0.97] ${
                active
                  ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                  : "bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-600 hover:text-stone-200"
              }`}>
              <span className="text-base shrink-0">{cat.icon}</span>
              <span className="text-xs font-semibold truncate flex-1">
                {cat.title}
              </span>
              {active && (
                <span className="ml-auto text-amber-400 text-xs shrink-0">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <PrimaryBtn onClick={onNext} disabled={selected.length === 0}>
        Devam Et{selected.length > 0 ? ` (${selected.length} seçili)` : ""}
      </PrimaryBtn>
      <SkipBtn onClick={onSkip} />
    </div>
  );
}

/* ─── Step 2: Konular ─────────────────────────────────────────────────── */
function TopicsStep({
  selected,
  toggle,
  custom,
  setCustom,
  addCustom,
  inputRef,
  onNext,
  onSkip,
}) {
  return (
    <div className="py-4">
      <h2
        className="text-xl font-black text-white mb-1"
        style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
        Takip etmek istediğin konular?
      </h2>
      <p className="text-stone-500 text-xs mb-4">
        Bu konular haberlerde geçince sana önce gösterilir
      </p>

      {/* Öneri chipler */}
      <div className="flex flex-wrap gap-2 mb-4 max-h-40 overflow-y-auto">
        {SUGGESTED_TOPICS.map((t) => {
          const active = selected.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-[0.96] ${
                active
                  ? "bg-amber-500 text-stone-950"
                  : "bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white"
              }`}>
              {active ? "✓ " : "+ "}
              {t}
            </button>
          );
        })}
      </div>

      {/* Özel konu ekleme */}
      <div className="flex gap-2 mb-4">
        <input
          ref={inputRef}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder="Başka konu ekle... (Enter)"
          className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
        />
        <button
          onClick={addCustom}
          disabled={!custom.trim()}
          className="px-3 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-white rounded-xl text-sm font-bold transition-colors">
          +
        </button>
      </div>

      {/* Eklenen özel konular */}
      {selected.filter((t) => !SUGGESTED_TOPICS.includes(t)).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {selected
            .filter((t) => !SUGGESTED_TOPICS.includes(t))
            .map((t) => (
              <span
                key={t}
                onClick={() => toggle(t)}
                className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded-full cursor-pointer hover:bg-red-900/30 hover:border-red-500/30 hover:text-red-400 transition-colors select-none">
                {t} ✕
              </span>
            ))}
        </div>
      )}

      <PrimaryBtn onClick={onNext} disabled={selected.length === 0}>
        Devam Et{selected.length > 0 ? ` (${selected.length} konu)` : ""}
      </PrimaryBtn>
      <SkipBtn onClick={onSkip} />
    </div>
  );
}

/* ─── Step 3: Şehir ───────────────────────────────────────────────────── */
function CityStep({ selected, setSelected, onNext, onSkip }) {
  return (
    <div className="py-4">
      <h2
        className="text-xl font-black text-white mb-1"
        style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
        Hangi şehirdesin?
      </h2>
      <p className="text-stone-500 text-xs mb-5">
        Hava durumu widget&apos;ı bu konuma göre ayarlanır
      </p>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {CITIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setSelected(c.key)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-[0.97] ${
              selected === c.key
                ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                : "bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-600 hover:text-white"
            }`}>
            {c.label}
          </button>
        ))}
      </div>
      <PrimaryBtn onClick={onNext}>Devam Et</PrimaryBtn>
      <SkipBtn onClick={onSkip} />
    </div>
  );
}

/* ─── Step 4: Bildirimler ─────────────────────────────────────────────── */
function NotifStep({ status, onRequest, onSkip }) {
  return (
    <div className="py-4 text-center flex flex-col items-center">
      <div
        className="text-5xl mb-5"
        style={{
          animation: "onbScaleIn 0.5s cubic-bezier(0.22,1,0.36,1) both",
        }}>
        🔔
      </div>
      <h2
        className="text-xl font-black text-white mb-2"
        style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
        Günlük özet bildirimi
      </h2>
      <p className="text-stone-400 text-sm leading-relaxed mb-8 max-w-xs">
        Her akşam en önemli 3 haberi ve gün özetini bildirim olarak al
      </p>

      {status === "granted" ? (
        <div className="py-3 w-full text-center">
          <p className="text-emerald-400 font-bold">✓ Bildirimler aktif!</p>
          <p className="text-xs text-stone-500 mt-1">Devam etmek için bekle…</p>
        </div>
      ) : status === "denied" ? (
        <div className="w-full space-y-3">
          <p className="text-xs text-stone-500 mb-4">
            Bildirim izni verilmedi. Tarayıcı ayarlarından sonradan açabilirsin.
          </p>
          <PrimaryBtn onClick={onSkip}>Devam Et</PrimaryBtn>
        </div>
      ) : (
        <div className="w-full space-y-2">
          <PrimaryBtn onClick={onRequest} disabled={status === "requesting"}>
            {status === "requesting"
              ? "İzin isteniyor…"
              : "Bildirimlere İzin Ver"}
          </PrimaryBtn>
          <SkipBtn onClick={onSkip} />
        </div>
      )}
    </div>
  );
}

/* ─── Step 5: Tamamlandı ──────────────────────────────────────────────── */
function CompleteStep({ onFinish, finishing }) {
  return (
    <div className="text-center py-10 flex flex-col items-center">
      <div
        className="text-6xl mb-6"
        style={{
          animation: "onbScaleIn 0.5s cubic-bezier(0.22,1,0.36,1) both",
        }}>
        🎉
      </div>
      <h2
        className="text-2xl font-black text-white mb-3"
        style={{ fontFamily: "var(--font-display, Georgia, serif)" }}>
        Harika! Hazırsın.
      </h2>
      <p className="text-stone-400 text-sm leading-relaxed mb-10 max-w-xs">
        Tercihlerine göre kişiselleştirilmiş haber akışın sana özel hazırlandı.
      </p>
      <div className="w-full max-w-xs">
        <PrimaryBtn onClick={onFinish} disabled={finishing}>
          {finishing ? "Yükleniyor…" : "Haberlere Geç →"}
        </PrimaryBtn>
      </div>
    </div>
  );
}

/* ─── Ana bileşen ─────────────────────────────────────────────────────── */
export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState("");
  const [selectedCity, setSelectedCity] = useState("Istanbul");
  const [notifStatus, setNotifStatus] = useState("idle");
  const inputRef = useRef(null);

  function next() {
    setStep((s) => s + 1);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function toggleCategory(slug) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug],
    );
  }
  function toggleTopic(t) {
    setSelectedTopics((prev) =>
      prev.includes(t) ? prev.filter((k) => k !== t) : [...prev, t],
    );
  }
  function addCustomTopic() {
    const t = customTopic.trim();
    if (!t || selectedTopics.includes(t)) return;
    setSelectedTopics((prev) => [...prev, t]);
    setCustomTopic("");
    inputRef.current?.focus();
  }

  async function requestNotification() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      next();
      return;
    }
    setNotifStatus("requesting");
    try {
      const perm = await Notification.requestPermission();
      setNotifStatus(perm === "granted" ? "granted" : "denied");
      if (perm === "granted") setTimeout(next, 900);
    } catch {
      setNotifStatus("denied");
    }
  }

  function finish() {
    const prefs = {
      ...DEFAULT_PREFERENCES,
      preferredCategories: selectedCategories,
      followedTopics: selectedTopics,
    };
    savePrefs(prefs);
    if (typeof window !== "undefined") {
      localStorage.setItem(CITY_KEY, selectedCity);
      localStorage.setItem(ONBOARDING_KEY, "1");
    }
    setFinishing(true);
    setTimeout(onComplete, 900);
  }

  // Progress bar (adım 1-4 arası)
  const showProgress = step >= 1 && step <= 4;
  const progressPct = ((step - 1) / 3) * 100; // 0,33,66,100

  return (
    <div
      className={`fixed inset-0 z-9999 bg-stone-950 flex flex-col overflow-hidden transition-opacity duration-700 ${
        finishing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}>
      {/* Ambient dekor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-16 w-60 h-60 rounded-full bg-amber-400/5 blur-2xl" />
      </div>

      {/* Progress header */}
      {showProgress && (
        <div className="relative z-10 px-6 pt-10 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={back}
              className="text-[11px] font-bold uppercase tracking-widest text-stone-600 hover:text-stone-300 transition-colors">
              ← Geri
            </button>
            <span className="text-[10px] text-stone-600">{step} / 4</span>
            <button
              onClick={next}
              className="text-[11px] font-bold uppercase tracking-widest text-stone-600 hover:text-stone-300 transition-colors">
              Atla →
            </button>
          </div>
          <div className="h-0.5 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Step content — key değişince animasyon tetiklenir */}
      <div className="flex-1 overflow-y-auto">
        <div
          key={step}
          className="w-full max-w-md mx-auto px-6 py-4"
          style={{
            animation: "onbStepIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
          }}>
          {step === 0 && <WelcomeStep onStart={next} />}
          {step === 1 && (
            <CategoryStep
              selected={selectedCategories}
              toggle={toggleCategory}
              onNext={next}
              onSkip={next}
            />
          )}
          {step === 2 && (
            <TopicsStep
              selected={selectedTopics}
              toggle={toggleTopic}
              custom={customTopic}
              setCustom={setCustomTopic}
              addCustom={addCustomTopic}
              inputRef={inputRef}
              onNext={next}
              onSkip={next}
            />
          )}
          {step === 3 && (
            <CityStep
              selected={selectedCity}
              setSelected={setSelectedCity}
              onNext={next}
              onSkip={next}
            />
          )}
          {step === 4 && (
            <NotifStep
              status={notifStatus}
              onRequest={requestNotification}
              onSkip={next}
            />
          )}
          {step === 5 && (
            <CompleteStep onFinish={finish} finishing={finishing} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes onbStepIn {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes onbScaleIn {
          from { opacity: 0; transform: scale(0.65); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
