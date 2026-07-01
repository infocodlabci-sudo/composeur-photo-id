const CACHE_NAME = 'photoid-pro-v3';

self.addEventListener('install', (event) => {
  // skipWaiting force le nouveau SW à remplacer l'ancien immédiatement
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // On cache chaque fichier individuellement
      // Si un fichier manque, les autres sont quand même mis en cache
      const files = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
      return Promise.allSettled(files.map(f => cache.add(f).catch(() => {})));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Laisser passer les CDN externes (module IA détourage)
  if (!url.hostname.includes(self.location.hostname)) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
  );
});
