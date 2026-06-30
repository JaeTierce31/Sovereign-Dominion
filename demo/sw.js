// Sovereign Dominion — Service Worker
// Cache version: bump this string whenever assets change to invalidate old caches.
const CACHE = 'sd-demo-v5';

// Pre-cached on install — all local demo assets
const PRECACHE = [
  './',
  './index.html',
  './app.css',
  './manifest.json',
  './certificate.js',
  './confetti.js',
  './council-demo.js',
  './esther-demo.js',
  './hermes.js',
  './mmr-demo.js',
  './qssm-demo.js',
  './scugs-demo.js',
  './stripe.js',
  './three-beam.js',
  './intent.js',
  './exec-graph.js',
  './capability-registry.js',
  './self-healing.js',
  './icon-192.png',
  './icon-512.png',
  './pkg/moloch_mmr.js',
  './pkg/moloch_mmr_bg.wasm',
  './pkg/qssm_rs.js',
  './pkg/qssm_rs_bg.wasm',
];

// CDN origins — network-first, cache fallback (Three.js via esm.sh)
const CDN_ORIGINS = ['https://esm.sh'];

// Backend — never intercept; always hit the network
const BACKEND_ORIGINS = ['http://localhost:3001', 'https://localhost:3001'];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Never intercept backend API or non-GET requests
  if (request.method !== 'GET') return;
  if (BACKEND_ORIGINS.some(o => request.url.startsWith(o))) return;

  // CDN assets (Three.js) — network first, opportunistic cache, fallback to cache
  if (CDN_ORIGINS.some(o => url.origin === new URL(o).origin)) {
    e.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Local assets — cache first, network fallback + populate cache
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(request, clone));
          }
          return res;
        })
        .catch(() => {
          // Navigation fallback: serve the app shell so deep links still load offline
          if (request.mode === 'navigate') return caches.match('./index.html');
        });
    })
  );
});
