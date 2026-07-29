"use client";

import { useEffect, useState } from "react";

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushNotificationToggle({
  compact = false,
  onSubscribed,
  onError,
}) {
  const [permission, setPermission] = useState("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isPushSupported()) return;
    setSupported(true);
    setPermission(Notification.permission);

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  const subscribe = async () => {
    if (!isPushSupported()) return;
    setLoading(true);
    setError("");
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error("Bildirim anahtarı yapılandırılmamış.");
      }

      const reg = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setError("İzin verilmedi. Tarayıcı isteminde İzin Ver’i seç.");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("Abonelik kaydı başarısız.");

      setSubscribed(true);
      onSubscribed?.();
    } catch (err) {
      console.error("[PushToggle] Abone olma hatası:", err);
      const msg = err?.message || "Abone olunamadı.";
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("[PushToggle] Abonelik iptal hatası:", err);
      setError("Abonelik iptal edilemedi.");
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return compact ? null : (
      <p className="text-xs text-[var(--text-muted)]">
        Bu tarayıcı web bildirimlerini desteklemiyor.
      </p>
    );
  }

  if (permission === "denied") {
    return (
      <p className="text-xs text-[var(--text-muted)] max-w-[16rem]">
        Bildirimler engellendi. Tarayıcı site ayarlarından izin ver.
      </p>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={loading}
          aria-pressed={subscribed}
          aria-label={subscribed ? "Bildirimleri kapat" : "Bildirimleri aç"}
          className={`relative inline-flex h-6 w-11 items-center transition-colors focus:outline-none disabled:opacity-50 border ${
            subscribed
              ? "bg-[var(--accent-brand)] border-[var(--accent-brand)]"
              : "bg-[var(--bg-elevated)] border-[var(--border-subtle)]"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform bg-[var(--bg-card)] shadow transition-transform ${
              subscribed ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        {error && (
          <p className="text-[10px] text-[var(--danger)] max-w-[10rem] text-right">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={loading}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 border ${
          subscribed
            ? "bg-transparent text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
            : "bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] hover:bg-[var(--accent-brand)] hover:border-[var(--accent-brand)] hover:text-[#1c1917]"
        }`}
      >
        {loading
          ? "Bekle…"
          : subscribed
            ? "Bildirimleri kapat"
            : "Bildirimleri aç"}
      </button>
      {error && <p className="text-[11px] text-[var(--danger)]">{error}</p>}
    </div>
  );
}
