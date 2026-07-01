const CACHE_NAME = 'photoid-pro-v4';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(APP_SHELL.map(f => cache.add(f).catch(() => {})))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Laisser passer TOUS les domaines externes sans interception
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  // Stratégie : CACHE FIRST — on sert le cache, on met à jour en arrière-plan
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const fetchPromise = fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => null);

      // Si on a une version en cache → on la sert immédiatement
      // La mise à jour se fait en arrière-plan pour la prochaine fois
      return cached || fetchPromise || cache.match('./index.html');
    })
  );
});
