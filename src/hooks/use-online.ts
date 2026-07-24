'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks browser connectivity (PRD 4. fejezet – Offline működés). Returns `true`
 * when online. SSR and the first client render assume online to avoid a flash of
 * the offline banner before hydration.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
}
