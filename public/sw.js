/* ═══════════════════════════════════════════════════════════════
   TuComida Service Worker  — v15
   Strategy:
     • HTML / navigation   → Network First  (always fresh content)
     • Images              → Cache First    (long TTL)
     • Everything else     → Network Only   (JS/CSS always fresh)
   Offline:                → /offline.html  fallback
═══════════════════════════════════════════════════════════════ */

const SW_VERSION   = 'v15';
const STATIC_CACHE = `tucomida-static-${SW_VERSION}`;
const IMAGE_CACHE  = `tucomida-images-${SW_VERSION}`;
const OFFLINE_URL  = '/offline.html';

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/manifest.json'
];

/* Domains to pass through without caching */
const BYPASS_PATTERNS = [
  'firebase',
  'firebasestorage',
  'firebaseapp',
  'firebaseio',
  'googleapis',
  'gstatic',
  'jsdelivr',
  'fonts.goog',
  'wa.me',
  'maps.google'
];

/* ── Install ──────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .catch(err => console.warn('[SW] Precache partial failure:', err))
      .finally(() => self.skipWaiting())
  );
});

/* ── Activate ─────────────────────────────────────────────── */
self.addEventListener('activate', event => {
  const validCaches = new Set([STATIC_CACHE, IMAGE_CACHE]);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => !validCaches.has(k))
          .map(k => { console.log('[SW] Deleting old cache:', k); return caches.delete(k); })
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Helpers ──────────────────────────────────────────────── */
function shouldBypass(url) {
  return BYPASS_PATTERNS.some(p => url.includes(p))
    || !url.startsWith(self.location.origin);
}

function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)(\?.*)?$/i.test(url);
}

function isNavigationRequest(request, url) {
  return request.mode === 'navigate'
    || url.endsWith('.html')
    || url.endsWith('/');
}

/* ── Fetch ────────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  /* Skip non-GET, external, and Firebase requests */
  if (request.method !== 'GET' || shouldBypass(url)) return;

  /* ── Strategy 1: Navigation / HTML → Network First ── */
  if (isNavigationRequest(request, url)) {
    event.respondWith(
      fetch(request, { credentials: 'same-origin' })
        .catch(() =>
          caches.match(request)
            .then(cached => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  /* ── Strategy 2: Images → Cache First ── */
  if (isImageRequest(url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;

          return fetch(request)
            .then(response => {
              if (response && response.status === 200 && response.type === 'basic') {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => new Response('', { status: 408 }));
        })
      )
    );
    return;
  }

  /* ── Strategy 3: Everything else → Network Only (with cache fallback) ── */
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

/* ── Background Sync placeholder ─────────────────────────── */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-orders') {
    console.log('[SW] Background sync: sync-pending-orders');
    /* Future: retry failed order submissions */
  }
});

/* ── Push Notifications placeholder ──────────────────────── */
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json().catch(() => ({ title: 'TuComida', body: event.data.text() }));
  event.waitUntil(
    data.then(({ title = 'TuComida', body = '', icon = '/icons/icon-192.png', tag }) =>
      self.registration.showNotification(title, { body, icon, tag, dir: 'rtl', lang: 'ar' })
    )
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const focused = list.find(c => c.focused);
        return focused ? focused.focus() : clients.openWindow('/');
      })
  );
});
