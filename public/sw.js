// 14 Trades Alert — Service Worker
// Handles: push notifications, background sync, offline cache

const CACHE   = '14trades-v12';
const ASSETS  = ['/', '/index.html', '/app.js', '/style.css', '/manifest.json'];

// ─── Install: cache core assets ───────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// ─── Activate: clean old caches ───────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: serve from cache, fallback to network ─────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ─── Push: show notification ──────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();

  const { title, body, type, asset, direction } = data;

  // Pick icon and badge color per type
  const icons = {
    prep:     '/icons/icon-yellow.png',
    signal:   '/icons/icon-gold.png',
    tp_hit:   '/icons/icon-green.png',
    sl_hit:   '/icons/icon-red.png',
  };

  const options = {
    body,
    icon:  icons[type] || '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag:   `${type}-${asset}`,        // collapses duplicate alerts
    renotify: type === 'signal',      // vibrate again for new signal
    requireInteraction: type === 'signal', // stay visible until tapped
    data: { url: '/', type, asset, direction },
    actions: type === 'signal' ? [
      { action: 'open', title: 'Open App' },
    ] : [],
    vibrate: type === 'sl_hit'
      ? [100, 50, 100, 50, 100]       // urgent pattern for SL
      : [100, 50, 100],
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification click: open app ─────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const existing = cls.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow('/');
    })
  );
});
