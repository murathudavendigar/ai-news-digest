import { siteConfig } from "@/app/lib/siteConfig";
import SpeechButton from "@/app/components/SpeechButton";
import SubscribeForm from "@/app/components/SubscribeForm";
import { generateDailySummary, getDailySummary } from "@/app/lib/dailySummary";
import Link from "next/link";

export const revalidate = 3600;

export const metadata = {
  title: "Günün Özeti",
  description: `${siteConfig.name} yapay zekası tarafından hazırlanan günlük haber özeti — bugün ne oldu, tek sayfada.`,
  openGraph: {
    title: `Günün Özeti — ${siteConfig.name}`,
    description:
      "Yapay zeka tarafından hazırlanan günlük haber özeti. Bugün ne oldu, tek sayfada.",
  },
};

// ── Konfigürasyonlar ───────────────────────────────────────────────────────
const MOOD_CONFIG = {
  tense: { label: "GERGİN", accent: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  hopeful: { label: "UMUTLU", accent: "#22c55e", bg: "rgba(34,197,94,0.08)" },
  turbulent: {
    label: "ÇALKANTILI",
    accent: "#f97316",
    bg: "rgba(249,115,22,0.08)",
  },
  calm: { label: "SAKİN", accent: "#38bdf8", bg: "rgba(56,189,248,0.08)" },
  critical: { label: "KRİTİK", accent: "#dc2626", bg: "rgba(220,38,38,0.08)" },
  uncertain: {
    label: "BELİRSİZ",
    accent: "#eab308",
    bg: "rgba(234,179,8,0.08)",
  },
  positive: { label: "OLUMLU", accent: "#22c55e", bg: "rgba(34,197,94,0.08)" },
};

const CAT_ICONS = {
  politics: "🏛️",
  business: "📈",
  world: "🌍",
  crime: "⚖️",
  health: "🏥",
  technology: "💻",
  other: "📰",
};

const WEATHER_ICONS = {
  açık: "☀️",
  güneşli: "☀️",
  bulutlu: "☁️",
  parçalı: "⛅",
  yağmurlu: "🌧️",
  yağmur: "🌧️",
  karlı: "❄️",
  fırtınalı: "⛈️",
  sisli: "🌫️",
  rüzgarlı: "💨",
};

function weatherIcon(condition = "") {
  const lower = (condition ?? "").toLowerCase();
  for (const [key, icon] of Object.entries(WEATHER_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "🌤️";
}

// ── Yardımcı bileşenler ────────────────────────────────────────────────────

function Divider({ title }) {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="flex-1 h-px bg-stone-700" />
      {title && (
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-500 px-2 whitespace-nowrap">
          {title}
        </p>
      )}
      <div className="flex-1 h-px bg-stone-700" />
    </div>
  );
}

function ImpactBadge({ impact }) {
  return (
    <span
      className={`inline-block text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 ${
        impact === "critical"
          ? "bg-red-600 text-white"
          : "bg-amber-500 text-stone-950"
      }`}>
      {impact === "critical" ? "KRİTİK" : "ÖNEMLİ"}
    </span>
  );
}

// ── Sayfa ──────────────────────────────────────────────────────────────────
export default async function SummaryPage() {
  let data = await getDailySummary();
  if (!data) data = await generateDailySummary();

  if (!data || data.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-950">
        <div className="space-y-3 text-center">
          <div
            className="text-6xl font-black text-stone-700"
            style={{ fontFamily: "Georgia, serif" }}>
            📰
          </div>
          <p className="text-sm text-stone-400">
            Günün baskısı hazırlanıyor...
          </p>
          <p className="text-xs text-stone-600">
            Her sabah 07:00&apos;de yayınlanır
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 mt-4 text-xs transition-colors border text-stone-600 hover:text-stone-400 border-stone-700">
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const mood = MOOD_CONFIG[data.dayMood] || MOOD_CONFIG.uncertain;
  const mustRead = data.mustRead || [];
  const sections = data.sections || [];
  const mainStory = mustRead[0];
  const secondaryStories = mustRead.slice(1, 3);
  const belowFoldStories = mustRead.slice(3);

  return (
    <div
      id="top"
      className="min-h-screen bg-stone-950 text-stone-200"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* ════════════════════════════════════════════════
          MASTHEAD — Gazete kimliği
      ════════════════════════════════════════════════ */}
      <div
        style={{
          backgroundColor: mood.bg,
          borderBottom: `2px solid ${mood.accent}`,
        }}>
        <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center justify-between flex-wrap gap-2">
          <p
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: mood.accent }}>
            ● {mood.label} — Günün Havası
          </p>
          <div className="flex items-center gap-4 text-[9px] text-stone-500 uppercase tracking-widest">
            {data.weather && (
              <span>
                {weatherIcon(data.weather.condition)} İstanbul:{" "}
                {data.weather.tempRange}
              </span>
            )}
            {data.markets?.usdTry && <span>$ {data.markets.usdTry}</span>}
            {data.markets?.bist100 && <span>BIST {data.markets.bist100}</span>}
          </div>
        </div>
      </div>

      <div className="px-6 mx-auto max-w-7xl">
        {/* Masthead logo + bilgiler */}
        <div className="py-6 text-center border-b-2 border-stone-700">
          {/* Üst meta satırı */}
          <div className="flex items-center justify-between text-[9px] text-stone-500 uppercase tracking-widest mb-4">
            <span>Sayı: {data.issueNumber || "—"}</span>
            <div className="flex-1 h-px mx-4 bg-stone-700" />
            <span className="text-stone-400">{data.date}</span>
            <div className="flex-1 h-px mx-4 bg-stone-700" />
            <span>Yıllık Baskı</span>
          </div>

          {/* Logo */}
          <h1 className="font-black leading-none tracking-tight text-white text-7xl md:text-8xl lg:text-9xl">
            Haber<span style={{ color: mood.accent }}>AI</span>
          </h1>
          <div className="flex items-center justify-center gap-3 mt-2 text-[9px] text-stone-500 uppercase tracking-[0.3em]">
            <span>Türkiye</span>
            <span style={{ color: mood.accent }}>·</span>
            <span>Dünya</span>
            <span style={{ color: mood.accent }}>·</span>
            <span>Analiz</span>
            <span style={{ color: mood.accent }}>·</span>
            <span>Yapay Zeka Destekli</span>
          </div>

          {/* Sub-headline + Sesli okuma */}
          <div className="flex flex-col items-center gap-3 mt-3">
            {data.subheadline && (
              <p className="max-w-2xl mx-auto text-sm italic text-stone-400">
                {data.subheadline}
              </p>
            )}
            <SpeechButton
              text={[
                data.date
                  ? `${data.date} — ${siteConfig.name} Günlük Özet.`
                  : `${siteConfig.name} Günlük Özet.`,
                data.intro,
                data.bigPicture,
                ...(mustRead || [])
                  .slice(0, 3)
                  .map((s, i) => `${i + 1}. ${s.title}. ${s.why || ""}`.trim()),
              ].filter(Boolean)}
              label="Sesli Dinle"
            />
          </div>
        </div>

        {/* İçindekiler navigasyonu */}
        <div className="sticky top-0 z-20 bg-stone-950 flex items-center gap-0 overflow-x-auto border-b border-stone-700">
          {sections.slice(0, 7).map((s, i) => (
            <a
              key={i}
              href={`#section-${i}`}
              className="px-4 py-2.5 text-[10px] font-bold text-stone-500 hover:text-white hover:bg-stone-800 transition-colors whitespace-nowrap border-r border-stone-700 uppercase tracking-widest">
              {s.emoji} {s.title}
            </a>
          ))}
          <a
            href="#world"
            className="px-4 py-2.5 text-[10px] font-bold text-stone-500 hover:text-white hover:bg-stone-800 transition-colors whitespace-nowrap uppercase tracking-widest">
            🌍 Dünya
          </a>
        </div>

        {/* ════════════════════════════════════════════════
            MANŞET BÖLÜMÜ — ana grid
        ════════════════════════════════════════════════ */}
        <section className="pt-8 pb-6 border-b border-stone-700">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* SOL SÜTUN: Ana manşet */}
            <div className="lg:col-span-7 lg:border-r lg:border-stone-700 lg:pr-8">
              {/* Ana başlık */}
              <div className="mb-5">
                <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.05] mb-3">
                  {data.headline}
                </h2>
                <div
                  className="w-20 h-1"
                  style={{ backgroundColor: mood.accent }}
                />
              </div>

              {/* Ana haber görseli */}
              {mainStory?.imageUrl && (
                <div className="mb-5 overflow-hidden">
                  <img
                    src={mainStory.imageUrl}
                    alt={mainStory.title}
                    className="w-full h-64 object-cover grayscale-20 hover:grayscale-0 transition-all duration-500"
                  />
                  <p className="text-[9px] text-stone-600 mt-1 uppercase tracking-wider">
                    {mainStory.title}
                  </p>
                </div>
              )}

              {/* Giriş metni */}
              <div className="mb-5 space-y-3">
                <p className="text-sm leading-relaxed text-stone-300">
                  {data.intro}
                </p>
                {data.bigPicture && (
                  <p className="pl-3 text-sm italic leading-relaxed border-l-2 text-stone-500 border-stone-700">
                    {data.bigPicture}
                  </p>
                )}
              </div>

              {/* Ana haber kutusu */}
              {mainStory && (
                <div className="p-5 border border-stone-700 bg-stone-900">
                  <div className="flex items-center gap-2 mb-3">
                    <ImpactBadge impact={mainStory.impact} />
                    <span className="text-[9px] text-stone-500 uppercase tracking-widest">
                      {CAT_ICONS[mainStory.category]} {mainStory.category}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-black leading-snug text-white">
                    {mainStory.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-stone-400">
                    {mainStory.why}
                  </p>
                </div>
              )}
            </div>

            {/* SAĞ SÜTUN: İkincil haberler + widget'lar */}
            <div className="space-y-0 divide-y lg:col-span-5 divide-stone-700">
              {/* İkincil haberler */}
              {secondaryStories.map((story, i) => (
                <div key={i} className="py-5 first:pt-0">
                  <div className="flex gap-4">
                    <span className="text-5xl font-black text-stone-800 leading-none shrink-0 w-10 mt-0.5">
                      {story.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <ImpactBadge impact={story.impact} />
                        <span className="text-[9px] text-stone-600 uppercase">
                          {CAT_ICONS[story.category]}
                        </span>
                      </div>
                      {story.imageUrl && (
                        <img
                          src={story.imageUrl}
                          alt={story.title}
                          className="w-full h-28 object-cover mb-2 grayscale-30"
                        />
                      )}
                      <h3 className="text-sm font-black text-white mb-1.5 leading-snug">
                        {story.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-stone-500">
                        {story.why}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Piyasa verileri */}
              {data.markets && (
                <div className="py-5">
                  <p className="text-[9px] font-black text-stone-600 uppercase tracking-widest mb-3">
                    📊 Piyasalar
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "BIST-100", value: data.markets.bist100 },
                      { label: "USD/TRY", value: data.markets.usdTry },
                      { label: "EUR/TRY", value: data.markets.eurTry },
                    ].map(
                      (item) =>
                        item.value && (
                          <div
                            key={item.label}
                            className="p-2 text-center border bg-stone-900 border-stone-700">
                            <p className="text-[8px] text-stone-600 uppercase tracking-wider mb-0.5">
                              {item.label}
                            </p>
                            <p className="text-sm font-black text-white">
                              {item.value}
                            </p>
                          </div>
                        ),
                    )}
                  </div>
                  {data.markets.note && (
                    <p className="text-[8px] text-stone-700 mt-1">
                      {data.markets.note}
                    </p>
                  )}
                </div>
              )}

              {/* Hava durumu */}
              {data.weather && (
                <div className="py-5">
                  <p className="text-[9px] font-black text-stone-600 uppercase tracking-widest mb-2">
                    🏙️ İstanbul Hava
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">
                      {weatherIcon(data.weather.condition)}
                    </span>
                    <div>
                      <p className="text-lg font-black text-white">
                        {data.weather.tempRange}
                      </p>
                      <p className="text-xs text-stone-500">
                        {data.weather.condition}
                      </p>
                      {data.weather.note && (
                        <p className="text-[10px] text-stone-600 italic mt-0.5">
                          {data.weather.note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            GÜNÜN SAYISI + KAVRAMI + ALINTI — yatay bant
        ════════════════════════════════════════════════ */}
        <section className="py-6 border-b border-stone-700">
          <div className="grid grid-cols-1 divide-y md:grid-cols-3 md:divide-y-0 md:divide-x divide-stone-700">
            {/* Günün sayısı */}
            {data.numberofDay && (
              <div className="py-4 md:py-0 md:pr-8">
                <p className="text-[9px] font-black text-stone-600 uppercase tracking-widest mb-2">
                  Günün Sayısı
                </p>
                <p
                  className="mb-2 text-6xl font-black leading-none"
                  style={{ color: mood.accent }}>
                  {data.numberofDay.figure}
                </p>
                <p className="text-xs leading-relaxed text-stone-400">
                  {data.numberofDay.context}
                </p>
              </div>
            )}

            {/* Günün kavramı */}
            {data.wordOfDay && (
              <div className="py-4 md:py-0 md:px-8">
                <p className="text-[9px] font-black text-stone-600 uppercase tracking-widest mb-2">
                  Günün Kavramı
                </p>
                <p className="mb-2 text-2xl italic font-black text-white">
                  {data.wordOfDay.word}
                </p>
                <p className="text-xs leading-relaxed text-stone-400">
                  {data.wordOfDay.definition}
                </p>
              </div>
            )}

            {/* Günün alıntısı */}
            {data.quoteOfDay && (
              <div className="py-4 md:py-0 md:pl-8">
                <p className="text-[9px] font-black text-stone-600 uppercase tracking-widest mb-2">
                  Günün Sözü
                </p>
                <p className="mb-2 text-sm italic leading-relaxed text-stone-300">
                  &quot;{data.quoteOfDay.text}&quot;
                </p>
                <p className="text-xs font-black text-white">
                  — {data.quoteOfDay.author}
                </p>
                {data.quoteOfDay.context && (
                  <p className="text-[10px] text-stone-600 mt-0.5">
                    {data.quoteOfDay.context}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            DİĞER ÖNEMLİ HABERLER — yatay bant
        ════════════════════════════════════════════════ */}
        {belowFoldStories.length > 0 && (
          <section className="py-6 border-b border-stone-700">
            <p className="text-[9px] font-black text-stone-600 uppercase tracking-widest mb-5">
              Diğer Önemli Gelişmeler
            </p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {belowFoldStories.map((story, i) => (
                <div
                  key={i}
                  className="pt-3 border-t-2"
                  style={{ borderColor: mood.accent }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-black text-stone-700">
                      {String(story.rank).padStart(2, "0")}
                    </span>
                    <ImpactBadge impact={story.impact} />
                    <span className="text-[9px] text-stone-600">
                      {CAT_ICONS[story.category]}
                    </span>
                  </div>
                  {story.imageUrl && (
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-full h-24 object-cover mb-2 grayscale-40"
                    />
                  )}
                  <h3 className="mb-1 text-sm font-black leading-snug text-white">
                    {story.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-stone-500">
                    {story.why}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════
            KATEGORİ SÜTUNLARI
        ════════════════════════════════════════════════ */}
        {sections.length > 0 && (
          <section className="py-8 border-b border-stone-700">
            <Divider title="Kategoriler" />
            <div className="grid grid-cols-1 gap-0 divide-x-0 divide-y md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:divide-y-0 md:divide-x divide-stone-700">
              {sections.map((section, i) => (
                <div
                  key={i}
                  id={`section-${i}`}
                  className="px-0 py-6 md:px-6 first:pl-0 last:pr-0">
                  {/* Bölüm başlığı */}
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-stone-700">
                    <span className="text-xl">{section.emoji}</span>
                    <div>
                      <p className="text-xs font-black tracking-widest text-white uppercase">
                        {section.title}
                      </p>
                      {section.headline && (
                        <p className="text-[10px] text-stone-500 italic mt-0.5">
                          {section.headline}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mb-4 text-sm leading-relaxed text-stone-300">
                    {section.summary}
                  </p>

                  {/* Haber listesi */}
                  {section.stories?.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {section.stories.map((story, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <span className="text-stone-700 shrink-0 mt-0.5">
                            ›
                          </span>
                          <div>
                            <p className="text-xs font-bold text-stone-300">
                              {story.title}
                            </p>
                            {story.brief && (
                              <p className="text-[10px] text-stone-600 mt-0.5">
                                {story.brief}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.outlook && (
                    <div className="pt-3 border-t border-stone-800">
                      <p className="text-[8px] font-black text-stone-600 uppercase tracking-widest mb-1">
                        Öngörü
                      </p>
                      <p className="text-[10px] text-stone-500 italic leading-relaxed">
                        {section.outlook}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════
            DÜNYA + TARİHTE BUGÜN — alt bant
        ════════════════════════════════════════════════ */}
        <section className="py-8 border-b border-stone-700" id="world">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:divide-x divide-stone-700">
            {/* Dünya başlıkları */}
            {data.worldHeadlines?.length > 0 && (
              <div className="lg:pr-8">
                <p className="text-[9px] font-black text-stone-600 uppercase tracking-widest mb-5">
                  🌍 Dünyadan
                </p>
                <div className="space-y-0 divide-y divide-stone-800">
                  {data.worldHeadlines.map((item, i) => (
                    <div key={i} className="py-4 first:pt-0">
                      <div className="flex items-start gap-3">
                        <span className="w-8 text-2xl font-black leading-none text-stone-800 shrink-0">
                          {i + 1}
                        </span>
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-stone-600 block mb-1">
                            {item.region}
                          </span>
                          <h3 className="mb-1 text-sm font-bold leading-snug text-stone-200">
                            {item.title}
                          </h3>
                          <p className="text-xs text-stone-500">{item.brief}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tarihte bugün */}
            {data.todayInHistory && (
              <div className="lg:pl-8">
                <p className="text-[9px] font-black text-stone-600 uppercase tracking-widest mb-5">
                  📅 Tarihte Bugün
                </p>
                <div className="p-6 border border-stone-700 bg-stone-900">
                  <p
                    className="mb-3 text-5xl font-black leading-none"
                    style={{ color: mood.accent }}>
                    {data.todayInHistory.year}
                  </p>
                  <h3 className="mb-2 text-lg font-black leading-snug text-white">
                    {data.todayInHistory.event}
                  </h3>
                  <p className="text-sm italic leading-relaxed text-stone-400">
                    {data.todayInHistory.significance}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            EDİTÖR NOTU
        ════════════════════════════════════════════════ */}
        {data.editorNote && (
          <section className="max-w-3xl py-12 mx-auto text-center">
            <p className="text-[9px] font-black text-stone-600 uppercase tracking-widest mb-6">
              Editörün Notu
            </p>
            <div className="relative px-10">
              <span className="absolute leading-none select-none -top-4 -left-2 text-8xl text-stone-800">
                &quot;
              </span>
              <blockquote className="text-lg italic leading-relaxed text-stone-300">
                {data.editorNote}
              </blockquote>
              <span className="absolute leading-none rotate-180 select-none -bottom-8 -right-2 text-8xl text-stone-800">
                &quot;
              </span>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════
            GAZETE FOOTER
        ════════════════════════════════════════════════ */}
        <footer className="py-6 mt-6 border-t-2 border-stone-700">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <p className="text-xl font-black text-white">
                Haber<span style={{ color: mood.accent }}>AI</span>
              </p>
              <p className="text-[9px] text-stone-700 mt-0.5 uppercase tracking-widest">
                Sayı {data.issueNumber || "—"} · {data.date}
              </p>
            </div>

            {/* Günlük e-posta aboneliği */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-[9px] text-stone-500 uppercase tracking-widest">
                Her sabah posta kutuna gelsin
              </p>
              <SubscribeForm accent={mood.accent} />
            </div>

            <div className="flex items-center gap-4">
              <a
                href="#top"
                className="text-xs font-bold tracking-widest uppercase transition-colors text-stone-600 hover:text-white">
                ↑ Başa Dön
              </a>
              <Link
                href="/"
                className="text-xs font-bold tracking-widest uppercase transition-colors text-stone-600 hover:text-white">
                Ana Sayfa →
              </Link>
            </div>
          </div>
          <p className="text-[9px] text-stone-800 text-center mt-6 uppercase tracking-widest">
            {data.articleCount} haber analiz edildi · Yapay zeka destekli ·
            Veriler yaklaşık değerler içerebilir
          </p>
        </footer>
      </div>
    </div>
  );
}
