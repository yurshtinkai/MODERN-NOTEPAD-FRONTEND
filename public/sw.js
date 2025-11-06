// Service Worker for Modern Notepad - Enables offline access
const CACHE_NAME = 'modern-notepad-v1';
const RUNTIME_CACHE = 'modern-notepad-runtime-v1';

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching essential files');
        // Cache the main HTML file
        return cache.addAll(['/']);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests - let them fail so our offline logic can handle them
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip external requests (but allow same origin)
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200) {
              return response;
            }

            // Only cache same-origin responses
            if (response.type === 'basic' || response.type === 'cors') {
              // Clone the response
              const responseToCache = response.clone();

              // Cache the response
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // If fetch fails and it's a navigation request, return index.html
            if (request.mode === 'navigate' || request.destination === 'document') {
              return caches.match('/index.html');
            }
            // For other requests, try to return from cache
            return caches.match(request);
          });
      })
  );
});

