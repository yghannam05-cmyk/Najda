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
  // For navigation requests serve index.html from cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match('/index.html');
      })
    );
    return;
  }

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
