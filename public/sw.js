// 14 Trades Alert — Service Worker
// Handles: push notifications, background sync, offline cache

const CACHE   = '14trades-v86';
const ASSETS  = ['/', '/index.html', '/app.js', '/style.css', '/manifest.json', '/trial.html', '/calculator.html'];

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
  const url = new URL(e.request.url);
  // Always fetch performance.html fresh from network
  if (url.pathname === '/performance.html' || url.pathname === '/trial.html' || url.pathname === '/calculator.html') {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ─── Push: show notification ──────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();

  // OneSignal sends 'body' for the notification text
  const type      = data.type || (data.data && data.data.type) || 'signal';
  const asset     = data.asset || (data.data && data.data.asset) || 'GOLD';
  const direction = data.direction || (data.data && data.data.direction) || '';
  const secondsUntilSignal = data.secondsUntilSignal || (data.data && data.data.secondsUntilSignal) || 60;
  const pushId    = data.id || (data.data && data.data.id) || Date.now().toString();
  const title     = data.title || data.headings || '14 Trades Alert';
  const body      = data.body  || data.contents || data.message || '';

  // Build full payload for app
  const message    = (data.data && data.data.message) || data.message || '';
  const fullPayload = { ...data, ...(data.data || {}), type, asset, direction, secondsUntilSignal, id: pushId, message };

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
    data: { url: '/', type, asset, direction, secondsUntilSignal, id: pushId },
    actions: type === 'signal' ? [
      { action: 'open', title: 'Open App' },
    ] : [],
    vibrate: type === 'sl_hit'
      ? [100, 50, 100, 50, 100]       // urgent pattern for SL
      : [100, 50, 100],
  };

  e.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      // Notify open app clients about push
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client => client.postMessage({
          type: 'PUSH_RECEIVED',
          payload: fullPayload
        }));
      })
    ])
  );
});

// ─── Notification click: open app ─────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const data = e.notification.data || {};
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const existing = cls.find(c => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        // Send message to trigger immediate UI update
        existing.postMessage({ type: 'NOTIFICATION_CLICKED', payload: data });
        // If broadcast, also send directly
        if (data.type === 'broadcast' && data.message) {
          existing.postMessage({ type: 'PUSH_RECEIVED', payload: { type: 'broadcast', message: data.message } });
        }
        return;
      }
      // Open app — pass data via URL so app can show correct UI on open
      let url = '/';
      if (data.type === 'prep') {
        url = `/?prep=${encodeURIComponent(JSON.stringify({type:data.type,asset:data.asset,direction:data.direction,secondsUntilSignal:data.secondsUntilSignal||60,id:data.id||Date.now().toString()}))}`;
      } else if (data.type === 'broadcast' && data.message) {
        url = `/?bc=${encodeURIComponent(data.message)}`;
      }
      return clients.openWindow(url);
    })
  );
});
