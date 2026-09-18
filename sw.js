const CACHE = 'phc-v3';
const ASSETS = ['./index.html','./css/tokens.css','./css/app.css','./js/data.js','./js/charts.js','./js/app.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Network-First strategy (always get the freshest data, fallback to cache if offline)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Only cache successful requests
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        // Save fresh copy in cache
        const responseToCache = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, responseToCache));
        return response;
      })
      .catch(() => caches.match(e.request)) // Fallback to cache if offline
  );
});
