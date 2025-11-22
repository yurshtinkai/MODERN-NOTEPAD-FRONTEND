// Service Worker for Modern Notepad - Enables offline access
// Version the cache to force updates on new deployments
const CACHE_VERSION = 'v2';
const CACHE_NAME = `modern-notepad-${CACHE_VERSION}`;
const RUNTIME_CACHE = `modern-notepad-runtime-${CACHE_VERSION}`;

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching essential files');
        // Cache the main HTML file
        return cache.addAll(['/']);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all caches that don't match current version
          if (!cacheName.startsWith(`modern-notepad-${CACHE_VERSION}`)) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim(); // Take control of all pages immediately
    })
  );
});

// Listen for messages from the page to skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Skipping waiting');
    self.skipWaiting();
  }
});

// Fetch event - network first for app files, cache fallback for offline
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

  // For HTML and JS files, use network-first strategy to get updates
  const isAppFile = request.mode === 'navigate' || 
                    request.destination === 'document' ||
                    url.pathname.endsWith('.js') ||
                    url.pathname.endsWith('.mjs');

  if (isAppFile) {
    // Network-first strategy for app files (to get updates)
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If we got a valid response, cache it
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If it's a navigation request and cache failed, return index.html
              if (request.mode === 'navigate' || request.destination === 'document') {
                return caches.match('/index.html');
              }
              return new Response('Offline', { status: 503 });
            });
        })
    );
  } else {
    // Cache-first strategy for static assets (images, fonts, etc.)
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(RUNTIME_CACHE)
                  .then((cache) => {
                    cache.put(request, responseToCache);
                  });
              }
              return response;
            })
            .catch(() => {
              if (request.mode === 'navigate' || request.destination === 'document') {
                return caches.match('/index.html');
              }
              return new Response('Offline', { status: 503 });
            });
        })
    );
  }
});

