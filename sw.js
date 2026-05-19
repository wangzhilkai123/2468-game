const CACHE = '2468-v1';
const FILES = [
  '.',
  'index.html',
  'css/style.css',
  'js/game.js',
  'js/render.js',
  'manifest.json'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(FILES);
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(r) {
      return r || fetch(e.request);
    })
  );
});
