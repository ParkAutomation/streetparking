// ParkSmart Service Worker
// ─────────────────────────────────────────────────────
// BUMP THIS on every deploy to force all users to get the new file
const APP_VERSION = 'v2026-06-11-1';
const CACHE_NAME  = 'parksmart-' + APP_VERSION;

const PRECACHE = ['./', './index.html'];

// ── Install: cache current version, skip waiting immediately ────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: purge ALL old caches, claim all tabs ───────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: network-first, fallback to cache (offline support) ────
// Network-first = users always get the latest GitHub file when online.
// Cache only serves when the network is unavailable.
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;

  // Skip Firebase and CDN requests — let them go straight to network
  const url = new URL(e.request.url);
  const isExternal = !url.origin.includes(self.location.origin) ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('googleapis');
  if(isExternal) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        if(response && response.status === 200 && response.type === 'basic'){
          caches.open(CACHE_NAME)
            .then(cache => cache.put(e.request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── Message: main script sends SKIP_WAITING when new SW is found ─
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
