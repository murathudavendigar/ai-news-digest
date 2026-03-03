"use client";

import { useEffect, useState } from "react";

// Tarayıcı bildirim desteğini kontrol et
function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
}

// base64 URL-safe → Uint8Array (VAPID public key için gerekli)
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushNotificationToggle({ compact = false }) {
  const [permission, setPermission] = useState("default"); // default | granted | denied
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    setSupported(true);
    setPermission(Notification.permission);

    // Mevcut SW aboneliğini kontrol et
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, []);

  const subscribe = async () => {
    if (!isPushSupported()) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      // İzin iste
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;

      // Push aboneliği oluştur
      const vapidKey = await getVapidPublicKey();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Sunucuya kaydet
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      setSubscribed(true);
    } catch (err) {
      console.error("[PushToggle] Abone olma hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return compact ? null : (
      <p className="text-xs text-stone-400 dark:text-stone-500">
        Bu tarayıcı web bildirimlerini desteklemiyor.
      </p>
    );
  }

  if (permission === "denied") {
    return (
      <p className="text-xs text-stone-400 dark:text-stone-500">
        Bildirimler engellendi. Tarayıcı ayarlarından izin ver.
      </p>
    );
  }

  if (compact) {
    // Settings sayfasındaki toggle görünümü
    return (
      <button
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50
          ${subscribed ? "bg-amber-500" : "bg-stone-200 dark:bg-stone-700"}`}>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
            ${subscribed ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    );
  }

  // Tam boyut buton (PushPrompt içinde kullanılır)
  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50
        ${
          subscribed
            ? "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
            : "bg-amber-500 hover:bg-amber-400 text-stone-950"
        }`}>
      <span>{loading ? "⏳" : subscribed ? "🔕" : "🔔"}</span>
      {loading
        ? "Lütfen bekle…"
        : subscribed
          ? "Bildirimleri Kapat"
          : "Bildirimleri Aç"}
    </button>
  );
}
