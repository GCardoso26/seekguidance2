const CACHE_SHELL = "tcg-judge-shell-v2";
const CACHE_API = "tcg-judge-api-v1";
const SHELL_URLS = ["/judge", "/manifest.json", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_SHELL).then((cache) => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => ![CACHE_SHELL, CACHE_API].includes(k)).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok && url.pathname.includes("/judge/daily-usage")) {
            const clone = res.clone();
            void caches.open(CACHE_API).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  if (url.pathname.match(/\.(js|css|png|svg|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request)),
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((r) => r ?? caches.match("/judge"))),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "Judge TCG", body: "", url: "/judge" };
  try {
    data = event.data ? event.data.json() : data;
  } catch {
    data.body = event.data ? event.data.text() : "";
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/apple-icon",
      badge: "/icon",
      tag: data.tag,
      data: { url: data.url || "/judge" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/judge";
  event.waitUntil(clients.openWindow(url));
});
