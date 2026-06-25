const CACHE_SHELL = "tcg-judge-shell-v4";
const CACHE_API = "tcg-judge-api-v2";
const CACHE_IMAGES = "tcg-judge-images-v1";
const CACHE_FONTS = "tcg-judge-fonts-v1";
const CACHE_PAGES = "tcg-judge-pages-v1";

const SHELL_URLS = ["/", "/offline", "/manifest.json", "/icon-192", "/icon-512"];

const API_RENDER = /^https:\/\/seekguidance\.onrender\.com\/.*/;
const IMAGE_EXT = /\.(?:png|jpg|jpeg|svg|gif|webp|avif)(?:\?.*)?$/i;
const FONT_EXT = /\.(?:woff2?|ttf|otf)(?:\?.*)?$/i;
const PAGE_PATHS = /^\/(loja\/mtg|decks|perfil|entrar)(?:\/|$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_SHELL).then((cache) => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = new Set([CACHE_SHELL, CACHE_API, CACHE_IMAGES, CACHE_FONTS, CACHE_PAGES]);
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

async function networkFirst(request, cacheName, networkTimeoutMs = 8000) {
  const cache = await caches.open(cacheName);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), networkTimeoutMs);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok || response.type === "opaque") {
      void cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error("network-failed");
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    void cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) void cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || networkPromise || fetch(request);
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (API_RENDER.test(url.href)) {
    event.respondWith(networkFirst(event.request, CACHE_API, 8000));
    return;
  }

  // Rotas /api/* passam direto ao servidor — evita cache/clone que quebra POST e auth.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (IMAGE_EXT.test(url.pathname) || url.hostname.includes("scryfall.io")) {
    event.respondWith(cacheFirst(event.request, CACHE_IMAGES));
    return;
  }

  if (FONT_EXT.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request, CACHE_FONTS));
    return;
  }

  if (url.origin === self.location.origin && PAGE_PATHS.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event.request, CACHE_PAGES));
    return;
  }

  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(cacheFirst(event.request, CACHE_SHELL));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .catch(async () => {
          const offline = await caches.match("/offline");
          if (offline) return offline;
          const shell = await caches.match("/");
          return shell || new Response("Offline", { status: 503 });
        }),
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((r) => r ?? caches.match("/offline")),
    ),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "Judge TCG", body: "", url: "/" };
  try {
    data = event.data ? event.data.json() : data;
  } catch {
    data.body = event.data ? event.data.text() : "";
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/apple-icon",
      badge: "/icon-192",
      tag: data.tag,
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
