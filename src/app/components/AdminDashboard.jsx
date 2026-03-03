"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function useCountUp(target, duration = 700) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const num =
      typeof target === "number" ? target : parseFloat(String(target));
    if (isNaN(num)) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplay(Math.round(eased * num));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return display;
}

/* ── Yardımcı bileşenler ── */

function Spinner({ sm }) {
  const sz = sm ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <svg className={`${sz} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function Section({ title, children, right }) {
  return (
    <div className="overflow-hidden border bg-stone-900 border-stone-800 rounded-2xl">
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-800">
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
          {title}
        </p>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Stat({ label, value, sub, color = "white", large }) {
  const isNumeric = typeof value === "number";
  const animated = useCountUp(isNumeric ? value : 0);
  const display = isNumeric ? animated : (value ?? "—");
  return (
    <div className="p-4 border bg-stone-950 border-stone-800 rounded-xl">
      <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-2">
        {label}
      </p>
      <p
        className={`font-black leading-none tabular-nums ${large ? "text-3xl" : "text-xl"} text-${color}-400`}
        style={color === "white" ? { color: "white" } : {}}>
        {display}
      </p>
      {sub && <p className="text-[10px] text-stone-600 mt-1.5">{sub}</p>}
    </div>
  );
}

function Badge({ children, color = "stone" }) {
  const map = {
    green: "bg-emerald-950/60 text-emerald-400 border-emerald-800",
    red: "bg-red-950/60 text-red-400 border-red-800",
    amber: "bg-amber-950/60 text-amber-400 border-amber-800",
    blue: "bg-blue-950/60 text-blue-400 border-blue-800",
    stone: "bg-stone-800 text-stone-400 border-stone-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${map[color]}`}>
      {children}
    </span>
  );
}

function ActionBtn({
  onClick,
  loading,
  disabled,
  variant = "ghost",
  children,
}) {
  const styles = {
    primary: "bg-amber-400 hover:bg-amber-300 text-stone-950",
    danger:
      "bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800",
    ghost:
      "bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700",
  };
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                  transition-colors disabled:opacity-40 ${styles[variant]}`}>
      {loading ? <Spinner sm /> : null}
      {children}
    </button>
  );
}

/* ── Formatlayıcılar ── */
const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";
const rel = (iso) => {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
};
const ms2s = (ms) =>
  ms == null ? "—" : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
const pct = (n) => (n == null ? "—" : `%${n}`);

/* ── Ana bileşen ── */
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null);
  const [toast, setToast] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [subscriberList, setSubscriberList] = useState(null);
  const [subListLoading, setSubListLoading] = useState(false);
  const [subFilter, setSubFilter] = useState("");
  const [removingEmail, setRemovingEmail] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // Manuel push bildirimi
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushUrl, setPushUrl] = useState("/");
  const [pushSending, setPushSending] = useState(false);
  const [pushResult, setPushResult] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin");
      if (r.ok) setData(await r.json());
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Otomatik yenileme — 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  const toggleSubscriberList = async () => {
    if (subscriberList !== null) {
      setSubscriberList(null);
      setSubFilter("");
      return;
    }
    setSubListLoading(true);
    try {
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list-subscribers" }),
      });
      const res = await r.json();
      setSubscriberList(res.emails || []);
    } catch {
      setSubscriberList([]);
    } finally {
      setSubListLoading(false);
    }
  };

  const removeSubscriber = async (email) => {
    if (!confirm(`"${email}" abonelikten çıkarılsın mı?`)) return;
    setRemovingEmail(email);
    try {
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove-subscriber", email }),
      });
      if (r.ok) {
        setSubscriberList((prev) => prev.filter((e) => e !== email));
        // stats'leri yenile
        load();
      }
    } catch {
    } finally {
      setRemovingEmail(null);
    }
  };

  const sendPush = async () => {
    if (!pushTitle.trim() || !pushBody.trim()) return;
    setPushSending(true);
    setPushResult(null);
    try {
      const r = await fetch("/api/admin/push-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pushTitle.trim(),
          body: pushBody.trim(),
          url: pushUrl.trim() || "/",
        }),
      });
      const res = await r.json();
      setPushResult({ ok: r.ok, ...res });
    } catch (e) {
      setPushResult({ ok: false, error: e.message });
    } finally {
      setPushSending(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const r = await fetch("/api/admin/analytics");
      const json = await r.json();
      if (!r.ok) setAnalyticsError(json.error || "Hata");
      else setAnalytics(json);
    } catch (e) {
      setAnalyticsError(e.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const act = async (action, label) => {
    setWorking(action);
    setToast(null);
    try {
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const res = await r.json();
      setToast({
        ok: r.ok,
        msg: r.ok ? `✓ ${label} tamamlandı` : `✕ ${res.error || "Hata"}`,
        detail: res.result ? JSON.stringify(res.result).slice(0, 120) : null,
      });
      if (action !== "trigger-cron") await load();
      else setTimeout(load, 4000);
    } catch (e) {
      setToast({ ok: false, msg: `✕ ${e.message}` });
    } finally {
      setWorking(null);
    }
  };

  if (loading && !data)
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="border h-28 bg-stone-900 border-stone-800 rounded-2xl animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    );

  const {
    stats,
    cache,
    logs = [],
    lastSuccess,
    cronSchedule,
    now,
  } = data || {};
  const s = stats || {};
  const sub = s.subscribers || {};
  const nf = s.newFeatures || {};

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`px-5 py-3 rounded-xl border text-sm font-medium flex items-start justify-between gap-3 ${
            toast.ok
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
              : "bg-red-950/40 border-red-800 text-red-300"
          }`}>
          <div>
            <p>{toast.msg}</p>
            {toast.detail && (
              <p className="text-[10px] opacity-70 mt-0.5 font-mono">
                {toast.detail}
              </p>
            )}
          </div>
          <button
            onClick={() => setToast(null)}
            className="opacity-50 hover:opacity-100 shrink-0">
            ✕
          </button>
        </div>
      )}

      {/* Üst özet — 4 kart */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          large
          label="Cache Durumu"
          value={cache?.today ? "✓ VAR" : "✕ YOK"}
          color={cache?.today ? "emerald" : "red"}
          sub={
            cache?.todayMeta
              ? `Sayı #${cache.todayMeta.issueNumber}`
              : "Henüz üretilmedi"
          }
        />
        <Stat
          large
          label="Son Cron"
          value={rel(lastSuccess)}
          color="white"
          sub={fmt(lastSuccess)}
        />
        <Stat
          large
          label="Bugün API"
          value={s.api?.callsToday ?? "—"}
          color="white"
          sub={`Toplam: ${s.api?.callsTotal ?? "—"}`}
        />
        <Stat
          large
          label="Cache Hit Rate"
          value={pct(s.cache?.hitRate)}
          color={
            s.cache?.hitRate >= 70
              ? "emerald"
              : s.cache?.hitRate >= 40
                ? "amber"
                : "red"
          }
          sub={`${s.cache?.hitsToday ?? 0} hit / ${s.cache?.missesToday ?? 0} miss`}
        />
      </div>

      {/* Aboneler & Yeni Özellik Sayıçları */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Aboneler */}
        <Section
          title="📧 E-posta Aboneleri"
          right={
            <button
              onClick={toggleSubscriberList}
              disabled={subListLoading}
              className="flex items-center gap-1.5 text-[10px] font-bold text-stone-500 hover:text-amber-400 transition-colors disabled:opacity-40">
              {subListLoading ? <Spinner sm /> : null}
              {subscriberList !== null ? "🙈 Gizle" : "👁 Listeyi Gör"}
            </button>
          }>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Stat
                large
                label="Toplam Abone"
                value={sub.total ?? 0}
                color="amber"
                sub="Redis SET (aktif)"
              />
              <Stat
                label="Bugün Yeni"
                value={sub.signupsToday ?? 0}
                color={sub.signupsToday > 0 ? "emerald" : "white"}
                sub="Kaydoldu"
              />
              <Stat
                label="Tüm Zamanlar"
                value={sub.signupsAllTime ?? 0}
                color="white"
                sub="Kümülatif sayış"
              />
            </div>

            {/* Abone listesi paneli */}
            {subscriberList !== null && (
              <div className="overflow-hidden border border-stone-800 rounded-xl">
                <div className="flex items-center gap-2 px-3 py-2 border-b bg-stone-950 border-stone-800">
                  <input
                    type="text"
                    placeholder="Filtrele…"
                    value={subFilter}
                    onChange={(e) => setSubFilter(e.target.value)}
                    className="flex-1 bg-transparent text-[11px] text-stone-300 placeholder-stone-700 outline-none"
                  />
                  <span className="text-[9px] text-stone-600 shrink-0">
                    {
                      subscriberList.filter((e) =>
                        e.includes(subFilter.toLowerCase()),
                      ).length
                    }{" "}
                    / {subscriberList.length}
                  </span>
                </div>
                {subscriberList.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-center text-stone-600">
                    Henüz abone yok.
                  </p>
                ) : (
                  <div className="overflow-y-auto divide-y max-h-60 divide-stone-800/60">
                    {subscriberList
                      .filter((e) => e.includes(subFilter.toLowerCase()))
                      .map((email, i) => (
                        <div
                          key={email}
                          className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-stone-800/40 group">
                          <span className="text-[9px] text-stone-700 tabular-nums w-5 shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-[11px] text-stone-300 font-mono truncate flex-1">
                            {email}
                          </span>
                          <button
                            onClick={() => removeSubscriber(email)}
                            disabled={removingEmail === email}
                            title="Abonelikten çıkar"
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity
                                       text-[9px] font-bold text-red-500 hover:text-red-400
                                       disabled:opacity-40 px-1.5 py-0.5 rounded border border-red-800/50
                                       hover:bg-red-950/30">
                            {removingEmail === email ? "⋯" : "✕ Çıkar"}
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>

        {/* Yeni özellik kullanım sayaçları */}
        <Section title="📡 Yeni Özellik Sayaçları">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="İlgili Haberler"
              value={nf.relatedNewsCalls ?? 0}
              color="white"
              sub="/api/related-news çağrısı"
            />
            <Stat
              label="Stream Özet"
              value={
                (s.cache?.byEndpoint?.["stream-summary"]?.hits ?? 0) +
                (s.cache?.byEndpoint?.["stream-summary"]?.misses ?? 0)
              }
              color="white"
              sub={`${s.cache?.byEndpoint?.["stream-summary"]?.hits ?? 0} cache hit`}
            />
          </div>
        </Section>
      </div>

      {/* İşlemler */}
      <Section
        title="İşlemler"
        right={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[10px] text-stone-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-3 h-3 accent-amber-400"
              />
              30s otomatik yenile
            </label>
            <button
              onClick={load}
              disabled={loading}
              className="text-[10px] font-bold text-stone-500 hover:text-stone-300 transition-colors flex items-center gap-1">
              {loading ? <Spinner sm /> : "↻"} Yenile
            </button>
          </div>
        }>
        <div className="flex flex-wrap gap-2.5">
          <ActionBtn
            variant="primary"
            onClick={() => act("trigger-cron", "Özet üretimi")}
            loading={working === "trigger-cron"}>
            ▶ Özeti Şimdi Üret
          </ActionBtn>
          <ActionBtn
            onClick={() => act("clear-cache", "Cache temizlendi")}
            loading={working === "clear-cache"}
            disabled={!cache?.today}>
            🗑 Cache Temizle
          </ActionBtn>
          <ActionBtn
            onClick={() => act("clear-logs", "Loglar temizlendi")}
            loading={working === "clear-logs"}
            disabled={!logs.length}>
            🧹 Logları Temizle
          </ActionBtn>
          <ActionBtn
            onClick={() =>
              act("clear-analysis-cache", "Analiz önbelleği temizlendi")
            }
            loading={working === "clear-analysis-cache"}>
            🔄 Skor Önbelleğini Temizle
          </ActionBtn>
          <ActionBtn
            variant="danger"
            onClick={() => act("reset-stats", "Stats sıfırlandı")}
            loading={working === "reset-stats"}>
            ⚠ Stats Sıfırla
          </ActionBtn>
        </div>
        <p className="text-[9px] text-stone-700 mt-3">
          Zamanlama: {cronSchedule} · Redis DB: {s.redis?.dbSize ?? "—"} key ·
          Şu an: {fmt(now)}
        </p>
      </Section>

      {/* Manuel Push Bildirimi */}
      <Section title="📲 Manuel Bildirim Gönder">
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="block text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">
                Başlık <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                maxLength={60}
                placeholder="📰 HaberAI — Son Dakika"
                className="w-full px-3 py-2 text-xs transition-colors border rounded-lg outline-none bg-stone-950 border-stone-700 text-stone-200 placeholder-stone-700 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">
                URL
              </label>
              <input
                type="text"
                value={pushUrl}
                onChange={(e) => setPushUrl(e.target.value)}
                placeholder="/summary"
                className="w-full px-3 py-2 text-xs transition-colors border rounded-lg outline-none bg-stone-950 border-stone-700 text-stone-200 placeholder-stone-700 focus:border-amber-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">
              Mesaj <span className="text-red-500">*</span>
            </label>
            <textarea
              value={pushBody}
              onChange={(e) => setPushBody(e.target.value)}
              maxLength={120}
              rows={2}
              placeholder="Bugünün en önemli haberleri hazır..."
              className="w-full px-3 py-2 text-xs transition-colors border rounded-lg outline-none resize-none bg-stone-950 border-stone-700 text-stone-200 placeholder-stone-700 focus:border-amber-500"
            />
            <p className="text-[9px] text-stone-700 mt-0.5 text-right">
              {pushBody.length}/120
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ActionBtn
              variant="primary"
              onClick={sendPush}
              loading={pushSending}
              disabled={!pushTitle.trim() || !pushBody.trim()}>
              📣 Gönder
            </ActionBtn>
            {pushResult && (
              <p
                className={`text-xs font-semibold ${
                  pushResult.ok ? "text-emerald-400" : "text-red-400"
                }`}>
                {pushResult.ok
                  ? `✓ ${pushResult.sent ?? 0} aboneye gönderildi`
                  : `✕ ${pushResult.error || "Hata oluştu"}`}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* Bugünkü özet */}
      {cache?.todayMeta && (
        <Section title="Bugünkü Özet — Önizleme">
          <div className="space-y-3">
            <p
              className="text-sm font-bold leading-snug text-white"
              style={{ fontFamily: "Georgia, serif" }}>
              {cache.todayMeta.headline}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="px-3 py-2 border rounded-lg bg-stone-950 border-stone-800">
                <p className="text-stone-600 mb-0.5">Sayı</p>
                <p className="font-black text-white">
                  #{cache.todayMeta.issueNumber}
                </p>
              </div>
              <div className="px-3 py-2 border rounded-lg bg-stone-950 border-stone-800">
                <p className="text-stone-600 mb-0.5">Haber</p>
                <p className="font-black text-white">
                  {cache.todayMeta.articleCount} adet
                </p>
              </div>
              <div className="px-3 py-2 border rounded-lg bg-stone-950 border-stone-800">
                <p className="text-stone-600 mb-0.5">Ruh Hali</p>
                <p className="font-black text-amber-400">
                  {cache.todayMeta.dayMood || "—"}
                </p>
              </div>
              <div className="px-3 py-2 border rounded-lg bg-stone-950 border-stone-800">
                <p className="text-stone-600 mb-0.5">Üretildi</p>
                <p className="font-black text-white">
                  {rel(cache.todayMeta.generatedAt)}
                </p>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* AI Provider İstatistikleri */}
      {s.aiProviders && Object.keys(s.aiProviders).length > 0 && (
        <Section title="AI Provider İstatistikleri">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(s.aiProviders).map(([key, p]) => {
              const hasErrors = p.errors > 0 || p.rateLimits > 0;
              const isActive = p.callsToday > 0;
              return (
                <div
                  key={key}
                  className={`p-4 border rounded-xl ${
                    isActive
                      ? "bg-stone-950 border-stone-700"
                      : "bg-stone-950/50 border-stone-800"
                  }`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-black text-stone-200">
                      {p.name}
                    </p>
                    <span
                      className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-stone-700"}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <p className="text-stone-600">Bugün</p>
                      <p className="font-black text-white tabular-nums">
                        {p.callsToday}
                      </p>
                    </div>
                    <div>
                      <p className="text-stone-600">Toplam</p>
                      <p className="font-black text-white tabular-nums">
                        {p.calls}
                      </p>
                    </div>
                    <div>
                      <p className="text-stone-600">Hata</p>
                      <p
                        className={`font-black tabular-nums ${p.errors > 0 ? "text-red-400" : "text-stone-500"}`}>
                        {p.errors}
                      </p>
                    </div>
                    <div>
                      <p className="text-stone-600">429 Rate</p>
                      <p
                        className={`font-black tabular-nums ${p.rateLimits > 0 ? "text-amber-400" : "text-stone-500"}`}>
                        {p.rateLimits}
                      </p>
                    </div>
                  </div>
                  {hasErrors && (
                    <div className="h-1 mt-3 overflow-hidden rounded-full bg-stone-800">
                      <div
                        className="h-full rounded-full bg-amber-500/60"
                        style={{
                          width: `${Math.min(100, p.calls > 0 ? Math.round(((p.errors + p.rateLimits) / p.calls) * 100) : 0)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Cache detay */}
      <Section title="Cache Endpoint Detayı">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Object.entries(s.cache?.byEndpoint || {}).map(([ep, d]) => {
            const total = d.hits + d.misses;
            const rate = total > 0 ? Math.round((d.hits / total) * 100) : null;
            return (
              <div
                key={ep}
                className="p-4 border bg-stone-950 border-stone-800 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black uppercase text-stone-300">
                    {ep}
                  </p>
                  {rate !== null && (
                    <span
                      className={`text-[9px] font-black ${rate >= 70 ? "text-emerald-400" : rate >= 40 ? "text-amber-400" : "text-red-400"}`}>
                      %{rate}
                    </span>
                  )}
                </div>
                <div className="h-1 mb-3 overflow-hidden rounded-full bg-stone-800">
                  <div
                    className={`h-full rounded-full transition-all ${rate >= 70 ? "bg-emerald-500" : rate >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${rate || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-emerald-400">{d.hits} hit</span>
                  <span className="text-red-400">{d.misses} miss</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Cron stats */}
      <Section title="Cron İstatistikleri">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Toplam" value={s.cron?.totalRuns} />
          <Stat label="Başarılı" value={s.cron?.successRuns} color="emerald" />
          <Stat
            label="Hatalı"
            value={s.cron?.errorRuns}
            color={s.cron?.errorRuns > 0 ? "red" : "white"}
          />
          <Stat label="Atlandı" value={s.cron?.skippedRuns} />
          <Stat
            label="Başarı Oranı"
            value={pct(s.cron?.successRate)}
            color={s.cron?.successRate >= 80 ? "emerald" : "amber"}
          />
          <Stat label="Ort. Süre" value={ms2s(s.cron?.avgDurationMs)} />
        </div>
        {s.cron?.minDurationMs != null && (
          <p className="text-[10px] text-stone-600 mt-3">
            Min: {ms2s(s.cron.minDurationMs)} · Max:{" "}
            {ms2s(s.cron.maxDurationMs)}
          </p>
        )}
      </Section>

      {/* API hataları */}
      <Section title="API Hata Sayaçları">
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Gemini"
            value={s.errors?.gemini}
            color={s.errors?.gemini > 0 ? "red" : "white"}
            sub="Özet üretimi"
          />
          <Stat
            label="Groq"
            value={s.errors?.groq}
            color={s.errors?.groq > 0 ? "red" : "white"}
            sub="Analiz / Özet"
          />
          <Stat
            label="NewsAPI"
            value={s.errors?.news}
            color={s.errors?.news > 0 ? "red" : "white"}
            sub="Haber çekimi"
          />
        </div>
      </Section>

      {/* NewsData API key havuzu */}
      {s.newsApiKeys?.length > 0 && (
        <Section title="🔑 NewsData API Key Havuzu">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {s.newsApiKeys.map((k, i) => (
              <div
                key={i}
                className={`px-4 py-3 rounded-xl border flex items-center gap-2.5 ${
                  k.exhausted
                    ? "bg-red-950/30 border-red-900/50"
                    : "bg-emerald-950/20 border-emerald-900/40"
                }`}>
                <span className="text-lg">{k.exhausted ? "🔴" : "🟢"}</span>
                <div>
                  <p className="font-mono text-xs font-black text-stone-200">
                    {k.suffix}
                  </p>
                  <p
                    className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${k.exhausted ? "text-red-400" : "text-emerald-500"}`}>
                    {k.exhausted ? "Limit doldu" : "Aktif"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-stone-600 mt-3">
            Tükenen key&apos;ler 24 saat sonra otomatik olarak yeniden aktif
            olur. Yeni key eklemek için{" "}
            <code className="text-stone-500">NEWSDATA_API_KEYS</code> env
            değişkenine virgülle ekleyin.
          </p>
        </Section>
      )}

      {/* RSS Kaynak Durumu */}
      <RSSMonitor />

      {/* Cron log tablosu */}
      <Section title={`Cron Geçmişi — Son ${logs.length} Çalışma`}>
        {logs.length === 0 ? (
          <div className="py-10 text-center">
            <p className="mb-3 text-4xl">📭</p>
            <p className="text-sm text-stone-500">Henüz cron çalışmamış.</p>
            <p className="mt-1 text-xs text-stone-600">
              &quot;Özeti Şimdi Üret&quot; ile test edin.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  log.status === "success"
                    ? "bg-emerald-950/10 border-emerald-900/50"
                    : log.status === "error"
                      ? "bg-red-950/20 border-red-900/50"
                      : log.status === "skipped"
                        ? "bg-stone-800/40 border-stone-700"
                        : "bg-stone-800/30 border-stone-700"
                }`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      color={
                        log.status === "success"
                          ? "green"
                          : log.status === "error"
                            ? "red"
                            : log.status === "skipped"
                              ? "stone"
                              : "amber"
                      }>
                      {log.status === "success"
                        ? "✓ başarılı"
                        : log.status === "error"
                          ? "✕ hata"
                          : log.status === "skipped"
                            ? "⏭ atlandı"
                            : "⟳ çalışıyor"}
                    </Badge>
                    <Badge
                      color={
                        log.triggeredBy?.includes("manual") ? "amber" : "blue"
                      }>
                      {log.triggeredBy?.includes("manual")
                        ? "manuel"
                        : "otomatik"}
                    </Badge>
                    {log.dayMood && (
                      <Badge color="stone">😶 {log.dayMood}</Badge>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-stone-300">
                      {rel(log.triggeredAt)}
                    </p>
                    <p className="text-[9px] text-stone-600">
                      {fmt(log.triggeredAt)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 sm:grid-cols-4">
                  {[
                    ["Süre", ms2s(log.durationMs)],
                    ["Sayı", log.issueNumber ? `#${log.issueNumber}` : null],
                    [
                      "Haberler",
                      log.articleCount ? `${log.articleCount} adet` : null,
                    ],
                    ["Sebep", log.reason || log.step || null],
                  ]
                    .filter(([, v]) => v)
                    .map(([l, v]) => (
                      <div
                        key={l}
                        className="px-3 py-2 rounded-lg bg-stone-950/50">
                        <p className="text-[9px] text-stone-600">{l}</p>
                        <p className="text-[11px] font-black text-stone-300">
                          {v}
                        </p>
                      </div>
                    ))}
                </div>

                {log.error && (
                  <div className="mt-2.5 px-3 py-2 bg-red-950/30 border border-red-900/40 rounded-lg">
                    <p className="text-[9px] font-black text-red-500 mb-0.5 uppercase tracking-wider">
                      Hata
                    </p>
                    <p className="text-[10px] text-red-400 font-mono break-all">
                      {log.error}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ─── Vercel Analytics ─────────────────────────────────────────── */}
      <Section
        title="📊 Vercel Analytics — Son 7 Gün"
        right={
          <ActionBtn
            onClick={loadAnalytics}
            loading={analyticsLoading}
            variant="ghost">
            {analytics ? "Yenile" : "Yükle"}
          </ActionBtn>
        }>
        {!analytics && !analyticsLoading && !analyticsError && (
          <p className="py-2 text-xs text-stone-500">
            Vercel Analytics verilerini görmek için &quot;Yükle&quot; butonuna
            basın.
          </p>
        )}
        {analyticsLoading && (
          <div className="flex items-center gap-2 py-4 text-xs text-stone-500">
            <Spinner sm /> Yükleniyor...
          </div>
        )}
        {analyticsError && (
          <div className="px-4 py-3 text-xs text-red-400 border rounded-xl bg-red-950/30 border-red-900/40">
            {analyticsError === "VERCEL_TOKEN veya VERCEL_PROJECT_ID eksik"
              ? "⚠️ VERCEL_TOKEN ve VERCEL_PROJECT_ID ortam değişkenleri gerekli. Vercel → Settings → Environment Variables."
              : `Hata: ${analyticsError}`}
          </div>
        )}
        {analytics && (
          <div className="space-y-5">
            {/* Genel istatistikler */}
            {analytics.overview?.data && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Tekil Ziyaretçi", key: "uniqueVisitors" },
                  { label: "Sayfa Görüntüleme", key: "pageViews" },
                  {
                    label: "Ort. Süre",
                    key: "avgDuration",
                    fmt: (v) => (v == null ? "—" : `${Math.round(v / 1000)}s`),
                  },
                  {
                    label: "Hemen Çıkma",
                    key: "bounceRate",
                    fmt: (v) => (v == null ? "—" : `%${Math.round(v * 100)}`),
                  },
                ].map(({ label, key, fmt }) => {
                  const raw = analytics.overview.data[key];
                  const val = raw?.value ?? raw;
                  const prev = raw?.previousValue;
                  const display = fmt
                    ? fmt(val)
                    : (val?.toLocaleString("tr-TR") ?? "—");
                  const diff =
                    !fmt && prev != null && val != null ? val - prev : null;
                  return (
                    <div
                      key={key}
                      className="p-4 border bg-stone-950 border-stone-800 rounded-xl">
                      <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-2">
                        {label}
                      </p>
                      <p className="text-xl font-black text-white">{display}</p>
                      {diff !== null && (
                        <p
                          className={`text-[10px] mt-1 ${diff >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                          {diff >= 0 ? "+" : ""}
                          {diff.toLocaleString("tr-TR")} önceki döneme kıyasla
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* En çok görüntülenen sayfalar */}
            {analytics.topPages?.data?.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-3">
                  En Çok Ziyaret Edilen Sayfalar
                </p>
                <div className="space-y-1.5">
                  {analytics.topPages.data.slice(0, 8).map((page, i) => {
                    const maxViews = analytics.topPages.data[0]?.pageViews || 1;
                    const pct = Math.round(
                      ((page.pageViews || 0) / maxViews) * 100,
                    );
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[9px] text-stone-600 w-4 shrink-0 tabular-nums">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[11px] text-stone-300 truncate font-mono">
                              {page.path || page.page || "/"}
                            </span>
                            <span className="text-[9px] font-black text-stone-400 ml-2 shrink-0 tabular-nums">
                              {(page.pageViews || 0).toLocaleString("tr-TR")}
                            </span>
                          </div>
                          <div className="h-1 rounded-full bg-stone-800">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cihaz dağılımı */}
            {analytics.devices?.data?.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-3">
                  Cihaz Dağılımı
                </p>
                <div className="flex flex-wrap gap-2">
                  {analytics.devices.data.map((d, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 text-center border rounded-xl bg-stone-950 border-stone-800">
                      <p className="text-xs font-black text-white">
                        {d.device || d.type || "—"}
                      </p>
                      <p className="text-[9px] text-stone-500">
                        {(d.percentage != null
                          ? `%${Math.round(d.percentage * 100)}`
                          : d.pageViews?.toLocaleString("tr-TR")) || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <a
              href="https://vercel.com/analytics"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-stone-500 hover:text-stone-300 transition-colors">
              Vercel Analytics Paneli →
            </a>
          </div>
        )}
      </Section>

      {/* Vercel linki */}
      <div className="px-5 py-4 text-xs border bg-stone-900/50 border-stone-800 rounded-xl text-stone-600">
        <span className="font-bold text-stone-500">Vercel Cron Logs: </span>
        vercel.com → Proje → Settings → Cron Jobs — orada da otomatik
        çalışmaları görebilirsiniz.
      </div>
    </div>
  );
}

/* ── RSS Monitor bileşeni ── */
function RSSMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tested, setTested] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/rss-test");
      if (r.ok) {
        setData(await r.json());
        setTested(true);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section
      title="RSS Kaynak Durumu"
      right={
        <button
          onClick={runTest}
          disabled={loading}
          className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400
                     hover:text-amber-300 transition-colors disabled:opacity-50">
          {loading ? <Spinner sm /> : "▶"}
          {tested ? "Yeniden Test Et" : "Tüm Kaynakları Test Et"}
        </button>
      }>
      {!tested && !loading && (
        <div className="py-8 text-center">
          <p className="mb-2 text-3xl">📡</p>
          <p className="text-sm text-stone-500">
            RSS kaynaklarını test etmek için butona tıklayın.
          </p>
          <p className="mt-1 text-xs text-stone-600">{`Her kaynağa istek atılır, ~10-20 sn sürebilir.`}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-stone-500">
          <Spinner />{" "}
          <span className="text-sm">Kaynaklar test ediliyor...</span>
        </div>
      )}

      {tested && data && (
        <div className="space-y-4">
          {/* Özet */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="p-3 text-center border bg-stone-950 border-stone-800 rounded-xl">
              <p className="text-[9px] text-stone-500 uppercase tracking-wider mb-1">
                Çalışan
              </p>
              <p className="text-xl font-black text-emerald-400">
                {data.summary.ok}
              </p>
            </div>
            <div className="p-3 text-center border bg-stone-950 border-stone-800 rounded-xl">
              <p className="text-[9px] text-stone-500 uppercase tracking-wider mb-1">
                Hatalı
              </p>
              <p
                className={`text-xl font-black ${data.summary.error > 0 ? "text-red-400" : "text-stone-500"}`}>
                {data.summary.error}
              </p>
            </div>
            <div className="p-3 text-center border bg-stone-950 border-stone-800 rounded-xl">
              <p className="text-[9px] text-stone-500 uppercase tracking-wider mb-1">
                Toplam Haber
              </p>
              <p className="text-xl font-black text-white">
                {data.summary.totalArticles}
              </p>
            </div>
            <div className="p-3 text-center border bg-stone-950 border-stone-800 rounded-xl">
              <p className="text-[9px] text-stone-500 uppercase tracking-wider mb-1">
                Tam İçerik
              </p>
              <p className="text-xl font-black text-amber-400">
                {data.summary.withFullContent}
              </p>
            </div>
          </div>

          {/* Kaynak listesi */}
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {data.results.map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${
                  r.status === "ok"
                    ? "bg-stone-900 border-stone-800"
                    : r.status === "empty"
                      ? "bg-stone-900/50 border-stone-800/50"
                      : "bg-red-950/20 border-red-900/40"
                }`}>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      r.status === "ok"
                        ? "bg-emerald-500"
                        : r.status === "empty"
                          ? "bg-stone-600"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="text-xs font-bold text-stone-300">
                    {r.name}
                  </span>
                  {r.fullContent > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-950/40 border border-amber-800/40 text-amber-400 rounded font-bold">
                      TAM İÇERİK
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[10px] text-stone-500">
                  {r.status === "error" ? (
                    <span className="text-red-400">
                      {r.error?.slice(0, 40)}
                    </span>
                  ) : (
                    <>
                      <span>{r.count} haber</span>
                      <span
                        className={r.durationMs > 3000 ? "text-amber-400" : ""}>
                        {ms2s(r.durationMs)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-stone-700 text-right">
            Test süresi: {ms2s(data.summary.durationMs)} · {data.results.length}{" "}
            kaynak
          </p>
        </div>
      )}
    </Section>
  );
}
