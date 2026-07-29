// HaberAI Service Worker — v3
// Strateji: Cache-First statik, Network-First API, SWR sayfalar

const CACHE_NAME = "haberai-pages-v3";
const STATIC_CACHE = "haberai-static-v3";
const API_CACHE = "haberai-api-v3";

// Uygulama kabuğu — çevrimdışında da açılabilmeli
// /digest shell'de; ziyaret edilen HTML sayfalar (digest dahil) SWR ile CACHE_NAME'e yazılır
const APP_SHELL = [
  "/",
  "/digest",
  "/columns",
  "/saved",
  "/settings",
  "/offline",
  "/manifest.json",
  "/icon-192.png",
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // addAll tek hata ile tümünü düşürmesin
      await Promise.allSettled(APP_SHELL.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (k) => k !== STATIC_CACHE && k !== API_CACHE && k !== CACHE_NAME,
          )
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Sadece aynı origin
  if (url.origin !== self.location.origin) return;

  // SW / manifest güncellemeleri her zaman ağdan
  if (url.pathname === "/sw.js" || url.pathname === "/manifest.json") {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // API → Network-First (kısa timeout), yoksa cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE, 2000));
    return;
  }

  // Statik varlıklar → Cache-First
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|woff2|css|js)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML sayfalar → Stale-While-Revalidate
  const accept = request.headers.get("Accept") || "";
  if (request.mode === "navigate" || accept.includes("text/html")) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
  }
});

// ─── Stratejiler ─────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request, cacheName, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    clearTimeout(timer);
    const cached = await caches.match(request);
    return (
      cached ||
      new Response(JSON.stringify({ error: "offline" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      })
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || offlineFallback();
}

function offlineFallback() {
  return (
    caches.match("/offline") ||
    new Response(
      `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Çevrimdışı — HaberAI</title></head>
      <body style="margin:0;font-family:Georgia,serif;background:#fafaf9;color:#1c1917;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:2rem">
      <div><p style="letter-spacing:.2em;text-transform:uppercase;font-size:11px;color:#78716c;font-family:system-ui,sans-serif">HaberAI</p>
      <h1 style="font-size:1.75rem;margin:.5rem 0 1rem">Çevrimdışısınız</h1>
      <p style="color:#57534e;max-width:28ch;margin:0 auto 1.5rem;line-height:1.5">İnternet bağlantını kontrol et. Önbellekteki sayfalar hâlâ açılabilir.</p>
      <button onclick="location.reload()" style="background:#1c1917;color:#fafaf9;border:0;padding:.75rem 1.25rem;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;cursor:pointer">Tekrar dene</button>
      </div></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    )
  );
}

// ─── Push ─────────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {};
  try {
    const raw = event.data?.json?.() ?? event.data?.text?.();
    if (typeof raw === "string") {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { title: "HaberAI", body: raw };
      }
    } else if (raw && typeof raw === "object") {
      data = raw;
    }
  } catch {
    data = { title: "HaberAI", body: "Günün özeti hazır." };
  }

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = { title: "HaberAI", body: data };
    }
  }

  const title = data.title || "HaberAI";
  const body = data.body || "Günün özeti hazır.";
  const url = data.url || "/digest";
  const icon = data.icon || "/icon-192.png";
  const badge = data.badge || "/icon-192.png";
  const tag = data.tag || "haberai-daily";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: { url },
      tag,
      renotify: true,
      requireInteraction: false,
      actions: [
        { action: "open", title: "Oku" },
        { action: "dismiss", title: "Kapat" },
      ],
    }),
  );
});

// ─── Notification Click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const target = event.notification.data?.url || "/digest";
  const absolute = new URL(target, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            client.navigate(absolute);
            return client.focus();
          }
        }
        return clients.openWindow(absolute);
      }),
  );
});
