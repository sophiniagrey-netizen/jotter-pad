// Jotter Pad service worker — caches the app shell so it loads offline.
// All note data itself lives in localStorage, which already works offline;
// this just makes sure the HTML/CSS/JS/manifest load without a network hit.
//
// IMPORTANT: bump CACHE_NAME any time index.html/manifest.json changes.
// Browsers only re-run install() when sw.js itself changes byte-for-byte,
// so this version bump is what actually invalidates old cached assets.
const CACHE_NAME = 'jotter-pad-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for the app shell: always try to get the freshest version
// so updates show up on the very next reload, falling back to the cached
// copy when offline or the network fails.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
