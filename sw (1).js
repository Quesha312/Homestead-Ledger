const CACHE = 'homestead-ledger-v2';
const ASSETS = ['./index.html', './manifest.json', './icon.svg', './config.js', './supabase-data.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for our own app files, so a fresh deploy is always picked up
// immediately when online. Falls back to cache only if the network fails
// (offline use), which is what the cache is actually for.
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
