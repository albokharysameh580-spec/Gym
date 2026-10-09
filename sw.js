/* Offline shell for the standalone copy. Everything the app needs is cached on the first visit;
   after that it opens with no network. A new upload changes VERSION, which replaces the old cache. */
const VERSION = "2026.10.09-flat1";
const CACHE = 'athletic-assistant-' + VERSION;
const ASSETS = [
 "./",
 "./index.html",
 "./manifest.webmanifest",
 "./icon-192.png",
 "./icon-512.png",
 "./apple-touch-icon.png",
 "./changa-arabic-wght-normal.woff2",
 "./changa-latin-wght-normal.woff2",
 "./ibm-plex-sans-arabic-arabic-400-normal.woff2",
 "./ibm-plex-sans-arabic-latin-400-normal.woff2",
 "./ibm-plex-sans-arabic-arabic-500-normal.woff2",
 "./ibm-plex-sans-arabic-latin-500-normal.woff2",
 "./ibm-plex-sans-arabic-arabic-600-normal.woff2",
 "./ibm-plex-sans-arabic-latin-600-normal.woff2",
 "./ibm-plex-sans-arabic-arabic-700-normal.woff2",
 "./ibm-plex-sans-arabic-latin-700-normal.woff2"
];
self.addEventListener('install', e => {
  /* cache: 'reload' skips the browser's own HTTP cache, so a new upload is fetched fresh whatever the host's headers say */
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('athletic-assistant-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;   // video links and the like go straight to the network
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('./index.html') : undefined);
    if (hit) return hit;                                   // cached copy first: instant and works offline
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      return new Response('offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    }
  })());
});
