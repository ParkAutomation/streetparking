// ParkSmart Service Worker
// Bump APP_VERSION on every deploy — this is what forces all users to get the new file
const APP_VERSION = 'v2025-06-10-1';
const CACHE_NAME  = 'parksmart-' + APP_VERSION;

// Files to precache
const PRECACHE = [
  './',
  './index.html'
];

// ── Install: cache current version ──────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()) // take over immediately, don't wait
  );
});

// ── Activate: delete ALL old caches ─────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME) // delete any cache that isn't current version
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim()) // take control of all open tabs
  );
});

// ── Fetch: network-first, fall back to cache ─────────────────────
// Network-first means users always get the latest file when online.
// Cache is only used if the network fails (offline).
self.addEventListener('fetch', e => {
  // Only handle GET requests for our own origin
  if(e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Got a fresh response from network — update the cache
        if(response && response.status === 200 && response.type === 'basic'){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() =>
        // Network failed — return cached version (offline support)
        caches.match(e.request)
      )
  );
});

// ── Message: SKIP_WAITING ────────────────────────────────────────
// Called by the main script when a new SW is waiting
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
