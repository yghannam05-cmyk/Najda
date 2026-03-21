// NAJDA Service Worker — Offline Support
const CACHE = 'najda-v1';
const OFFLINE_ASSETS = [
  '/index.html',
  '/manifest.json'
];

// Install — cache core files
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(OFFLINE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', function(e) {

  e.respondWith(
    caches.match(e.request).then(function(response) {
      // Return cached version if exists
      if (response) {
        return response;
      }

      // Otherwise fetch and cache
      return fetch(e.request).then(function(networkResponse) {

        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const clone = networkResponse.clone();

        caches.open(CACHE).then(function(cache) {
          cache.put(e.request, clone);
        });

        return networkResponse;

      }).catch(function() {
        // fallback for navigation
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });

    })
  );
});

  // For everything else — network first, cache fallback
  e.respondWith(
    fetch(e.request).then(function(response) {
      // Cache successful responses
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
