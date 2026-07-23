/*
 * Vallordocs service worker (PRD 4. fejezet – PWA követelmények: telepítés,
 * offline cache, service worker, auto-frissítés; Background Sync).
 *
 * Plain, build-step-free worker (no bundler imports). Two caching strategies:
 *   - cache-first for the precached app shell and static assets, and
 *   - network-first for navigations, falling back to the cached shell offline.
 *
 * The cache name is versioned; bumping CACHE_VERSION invalidates old caches on
 * the next `activate`. Combined with skipWaiting()/clients.claim() and the
 * SKIP_WAITING message handler, this gives a controlled auto-update flow.
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `vallordocs-${CACHE_VERSION}`;

// Minimal shell precached at install time so the app boots fully offline.
const OFFLINE_URL = '/';
const PRECACHE_URLS = [OFFLINE_URL, '/manifest.webmanifest', '/icons/icon.svg'];

/** The Background Sync tag the Driver PWA registers for deferred uploads. */
const SYNC_TAG = 'vallordocs-sync';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
      // Activate this worker immediately rather than waiting for old tabs.
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from previous versions.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('vallordocs-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      // Take control of already-open clients without a reload.
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GETs are cacheable; let uploads and mutations pass straight through.
  if (request.method !== 'GET') {
    return;
  }

  // Network-first for navigations: always try the network so the driver sees
  // fresh data, but fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
          return response;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request);
          return cached || (await cache.match(OFFLINE_URL));
        }
      })(),
    );
    return;
  }

  // Cache-first for static, same-origin assets (the app shell, icons, …).
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        // Only cache successful, basic (same-origin) responses.
        if (response && response.status === 200 && response.type === 'basic') {
          cache.put(request, response.clone());
        }
        return response;
      })(),
    );
  }
});

/*
 * Background Sync entry point (PRD 4. fejezet – Offline működés, Background
 * Sync). When connectivity returns the browser fires this event for the
 * registered tag. This is a documented STUB: in the running app the handler
 * opens the offline queue persisted in IndexedDB and drains it using the pure
 * logic in `src/modules/offline/sync-queue.ts` (dueItems → markInFlight →
 * upload → markDone / markFailed with exponential backoff → dead-letter).
 *
 * That queue logic cannot be imported here without a bundler, so the concrete
 * IndexedDB wiring is added in the driver-upload milestone; keeping the tag and
 * lifecycle in place now lets the client register for sync today.
 */
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(drainSyncQueue());
  }
});

async function drainSyncQueue() {
  // STUB: replay pending document uploads from the offline queue. See the note
  // above — real IndexedDB read/replace lands with the driver-upload feature.
  return Promise.resolve();
}

// Auto-update flow: the page posts { type: 'SKIP_WAITING' } once the user
// accepts a pending update, letting the new worker take over immediately.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
