/*
 * Service worker for Civil Engineering Calculators
 * Implements a simple cache-first strategy to support offline use.
 */

const CACHE_NAME = 'civil-calculator-v1';
// Files to pre-cache
const PRECACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(
        names.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        // Cache the new resource
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(request, response.clone());
          return response;
        });
      }).catch(() => {
        // Offline fallback: return index for navigation requests
        if (request.headers.get('Accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});