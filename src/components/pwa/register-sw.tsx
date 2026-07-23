'use client';

import { useEffect } from 'react';

/**
 * Registers the Vallordocs service worker (PRD 4. fejezet – PWA követelmények:
 * telepítés, offline cache, service worker, auto-frissítés).
 *
 * Renders nothing. On mount it registers `/sw.js` when the browser supports
 * service workers and only in production builds (the worker aggressively caches,
 * which would interfere with local development). It also wires a minimal
 * update-available flow: when a new worker is found and finishes installing
 * while an old one still controls the page, it is told to activate immediately
 * via the `SKIP_WAITING` message the worker listens for.
 */
export function RegisterServiceWorker(): null {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    void navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (cancelled) return;

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.addEventListener('statechange', () => {
            // A new worker has installed while an old one is still in control:
            // an update is ready. Ask it to take over on the next navigation.
            if (
              installing.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(() => {
        // Registration failures are non-fatal; the app still works online.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
