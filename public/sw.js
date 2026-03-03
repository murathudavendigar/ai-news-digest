// HaberAI Service Worker — v1
// Strateji: Cache-First statik, Network-First API+sayfa

const CACHE_NAME = "haberai-v1";
const STATIC_CACHE = "haberai-static-v1";
const API_CACHE = "haberai-api-v1";

// Uygulama kabuğu — çevrimdışında da açılabilmeli
const APP_SHELL = ["/", "/saved", "/summary", "/settings", "/offline"];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting()),
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) => k !== STATIC_CACHE && k !== API_CACHE && k !== CACHE_NAME,
            )
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Sadece aynı origin + GET isteklerini yakala
  if (
    request.method !== "GET" ||
    !url.origin.startsWith(self.location.origin.slice(0, 4))
  )
    return;

  // API istekleri → Network-First (1.5s timeout), hata durumunda cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE, 1500));
    return;
  }

  // Statik varlıklar (_next/static, public/*.png vb.) → Cache-First
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|woff2|css|js)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Sayfalar → Stale-While-Revalidate
  if (request.headers.get("Accept")?.includes("text/html")) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
    return;
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
      `<!doctype html><html><body style="font-family:system-ui;text-align:center;padding:4rem">
      <h1>📡 Çevrimdışısınız</h1>
      <p>İnternet bağlantınızı kontrol edin.</p>
      <button onclick="location.reload()">Tekrar Dene</button>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } },
    )
  );
}

// ─── Push ─────────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: event.data?.text() ?? "HaberAI" };
  }

  const title = data.title ?? "HaberAI";
  const body = data.body ?? "Yeni haberler seni bekliyor.";
  const url = data.url ?? "/summary";
  const icon = data.icon ?? "/icon-192.png";
  const badge = data.badge ?? "/icon-192.png";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: { url },
      vibrate: [200, 100, 200],
      tag: "haberai-daily", // aynı tag → yeni bildirim eskisinin yerine geçer
      renotify: true,
    }),
  );
});

// ─── Notification Click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/summary";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Zaten açık sekme varsa ona odaklan
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Yoksa yeni sekme aç
        return clients.openWindow(url);
      }),
  );
});
