const CACHE_NAME = 'twinsdelight-cache-v2';

// Install Service Worker
self.addEventListener('install', event => {
  self.skipWaiting(); // Langsung aktifkan SW baru tanpa menunggu tab ditutup
});

// Activate Service Worker and clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Ambil alih semua client/tab langsung
  );
});

// Network-First Strategy for HTML/navigation & Cache-First for static assets
self.addEventListener('fetch', event => {
  const request = event.request;

  // Jika request berupa navigasi halaman / HTML, utamakan ambil dari Network dulu (agar update langsung terasa)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request)) // Fallback ke cache jika offline
    );
    return;
  }

  // Untuk asset statis lainnya: coba cache dulu, jika tidak ada baru fetch network
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // Asynchronously update cache in background (Stale-While-Revalidate)
        fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
        return networkResponse;
      });
    })
  );
});
