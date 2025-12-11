// Simple offline cache for Chowchala Interior tools

const CACHE_NAME = 'chowchala-interior-v1';

const URLS_TO_CACHE = [
  './',
  './index.html',
  './cabinet.html',         // cabinet_auto_cutlist_full_updated থেকে rename করে রাখবে
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: cache all core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Activate: delete old caches if version changed
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );

  return self.clients.claim();
});

// Fetch: cache-first, then network fallback
self.addEventListener('fetch', event => {
  const request = event.request;

  // Only handle GET
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // return cache, but update in background
        event.waitUntil(
          fetch(request)
            .then(networkResponse => {
              return caches.open(CACHE_NAME).then(cache => {
                cache.put(request, networkResponse.clone());
              });
            })
            .catch(() => {})
        );
        return cachedResponse;
      }

      // If not in cache, go to network and cache it
      return fetch(request)
        .then(networkResponse => {
          const respClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, respClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // Optional: offline fallback দিলে এখানে দিতে পারো
          return new Response(
            'Offline: এই পেইজ এখন cache এ নেই। পরে আবার চেষ্টা করো।',
            { status: 503, statusText: 'Offline' }
          );
        });
    })
  );
});
