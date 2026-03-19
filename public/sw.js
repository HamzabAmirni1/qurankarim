const CACHE_NAME = 'quran-cache-v1';

// We only cache the root and essential static assets.
// On desktop, the "white page" is often due to the Service Worker intercepting 
// requests for compiled assets (which have hashes in their names) but not finding them.
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  // Strategy: Network first, then cache for PWA stability.
  // This prevents the "White Page" issue when assets change on deploy.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
