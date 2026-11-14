self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open('happyracket-store-v6.1').then((cache) => {
      return cache.addAll(['./index.html', './styles.css', './script.js', './logo.png']);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});