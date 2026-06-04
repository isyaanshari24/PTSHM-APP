// ═══════════════════════════════════════════
//  Service Worker — PT. Sumber Hayati Mandiri
// ═══════════════════════════════════════════
const CACHE_NAME = 'ptshm-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: cache semua asset utama
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first untuk asset, network-first untuk API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Bypass cache untuk Google Sheets / Gemini API calls
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('script.google.com') ||
      url.hostname.includes('generativelanguage')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache response baru kalau valid
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
