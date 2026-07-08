// ScrabbleWordsFinder Service Worker
// Cache-first for static shell + dictionary files, network-first for API/dynamic

const CACHE_VERSION = 'swf-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const DICT_CACHE = `${CACHE_VERSION}-dict`;

// App shell — cached on install
const SHELL_ASSETS = [
  '/',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json',
];

// Dictionary files — large, rarely change, cache-first
const DICT_ASSETS = [
  '/data/sowpods-2-7.json',
  '/data/sowpods-8-15.json',
  '/data/twl06-2-7.json',
];

// Install: pre-cache shell + dictionary
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)),
      caches.open(DICT_CACHE).then((cache) => cache.addAll(DICT_ASSETS)),
    ]).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('swf-') && key !== SHELL_CACHE && key !== DICT_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST to APIs, etc.)
  if (request.method !== 'GET') return;

  // Skip API calls — always network
  if (url.pathname.startsWith('/api/')) return;

  // Skip admin pages — always network
  if (url.pathname.startsWith('/admin')) return;

  // Dictionary files: cache-first (they almost never change)
  if (url.pathname.startsWith('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DICT_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Static assets (images, SVGs, CSS, JS): stale-while-revalidate
  if (
    url.pathname.match(/\.(svg|png|jpg|jpeg|webp|gif|css|js|woff2?)$/) ||
    url.pathname.startsWith('/banner-options/') ||
    url.pathname.startsWith('/logo-options/') ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // HTML pages: network-first with cache fallback (for offline)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }
});
