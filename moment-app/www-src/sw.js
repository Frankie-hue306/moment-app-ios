/**
 * 此刻 Moment — Service Worker v2
 * Strategies: cache-first (static), network-first (API), stale-while-revalidate (locales)
 */
const VERSION = 'moment-v304-2';
const STATIC  = VERSION + '-static';
const IMG     = VERSION + '-images';
const API     = VERSION + '-api';

const PRECACHE = [
  '/', '/index.html', '/admin.html', '/manifest.json',
  '/css/design-tokens.css', '/css/components.css', '/css/app.css',
  '/js/i18n.js', '/js/api.js', '/js/components.js',
  '/js/app.js', '/js/auth.js', '/js/settings.js',
  '/js/capture.js', '/js/gallery.js', '/js/explore.js',
  '/js/collage.js', '/js/init.js', '/js/admin.js',
  '/starry-world.js',
];

// ── Install ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC).then(c => c.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

// ── Activate ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== STATIC && k !== IMG && k !== API).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ──
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const p = new URL(e.request.url).pathname;

  // Images: cache-first
  if (p.startsWith('/api/image/') || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(p)) {
    e.respondWith(cacheFirst(e.request, IMG));
    return;
  }
  // API: network-first
  if (p.startsWith('/api/')) {
    e.respondWith(networkFirst(e.request, API));
    return;
  }
  // Locales: stale-while-revalidate
  if (p.startsWith('/locales/')) {
    e.respondWith(staleWhileRevalidate(e.request, STATIC));
    return;
  }
  // JS/CSS: cache-first
  if (/\.(js|css)$/i.test(p)) {
    e.respondWith(cacheFirst(e.request, STATIC));
    return;
  }
  // HTML: network-first
  e.respondWith(networkFirst(e.request, STATIC));
});

// ── Strategies ──
function cacheFirst(req, cacheName) {
  return caches.match(req).then(hit =>
    hit || fetch(req).then(res => {
      if (res.ok) { const c = res.clone(); caches.open(cacheName).then(ca => ca.put(req, c)); }
      return res;
    }).catch(() => hit || new Response('Offline', { status: 503 }))
  );
}

function networkFirst(req, cacheName) {
  return fetch(req).then(res => {
    if (res.ok) { const c = res.clone(); caches.open(cacheName).then(ca => ca.put(req, c)); }
    return res;
  }).catch(() => caches.match(req).then(hit =>
    hit || new Response('Offline', { status: 503 })
  ));
}

function staleWhileRevalidate(req, cacheName) {
  return caches.match(req).then(hit => {
    const p = fetch(req).then(res => {
      if (res.ok) caches.open(cacheName).then(ca => ca.put(req, res.clone()));
      return res;
    });
    return hit || p;
  });
}
