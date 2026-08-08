// Florence service worker: network-first + cache fallback (app-shell).
// - /api/* asla cache'lenmez (dinamik veri).
// - Basarili GET yanitlari shell cache'ine eklenir; cekimde (offline) cache'ten
//   servis edilir, SPA route'lari icin /index.html fallback yapilir.
const CACHE = 'florence-shell-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(['/', '/index.html']))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return
  if (req.url.includes('/api/')) return // API network-only

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && req.method === 'GET') {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copy))
        }
        return res
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match('/index.html')),
      ),
  )
})
