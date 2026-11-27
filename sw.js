// Service worker AWS Gumitir. Naikkan angka VERSI_CACHE setiap kali index.html
// diganti supaya HP yang sudah memasang aplikasi ikut memuat versi terbaru.
const VERSI_CACHE = 'aws-gumitir-v3.4.1';
const CANGKANG = ['./', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI_CACHE).then(c => c.addAll(CANGKANG)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSI_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Data stasiun (Apps Script) selalu langsung ke jaringan, tidak di-cache
  if (url.hostname.indexOf('script.google') !== -1 || url.hostname.indexOf('googleusercontent') !== -1) return;
  if (url.origin === location.origin) {
    if (req.mode === 'navigate') {
      // Halaman: jaringan dulu supaya selalu versi terbaru, cadangan dari cache bila offline
      e.respondWith(fetch(req).then(r => {
        const salinan = r.clone(); caches.open(VERSI_CACHE).then(c => c.put('./index.html', salinan)); return r;
      }).catch(() => caches.match('./index.html')));
      return;
    }
    e.respondWith(caches.match(req).then(h => h || fetch(req).then(r => {
      const salinan = r.clone(); caches.open(VERSI_CACHE).then(c => c.put(req, salinan)); return r;
    })));
    return;
  }
  // CDN (Chart.js, font): pakai cache sambil memperbarui di belakang
  e.respondWith(caches.open(VERSI_CACHE).then(c => c.match(req).then(h => {
    const baru = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => h);
    return h || baru;
  })));
});
