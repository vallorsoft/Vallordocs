'use client';

import { CloudOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useOnline } from '@/hooks/use-online';

/**
 * Offline indicator (PRD 4. fejezet – Offline működés). Shows a persistent,
 * screen-reader-announced banner while the device has no connectivity so the
 * driver knows captures are being queued for automatic sync.
 */
export function OfflineBanner() {
  const t = useTranslations('offline');
  const online = useOnline();
  if (online) return null;

  return (
    <div
      className="flex items-center gap-2 bg-amber-500/15 px-4 py-2 text-sm text-amber-700 dark:text-amber-300"
      role="status"
      aria-live="polite"
    >
      <CloudOff className="h-4 w-4 shrink-0" aria-hidden />
      {t('banner')}
    </div>
  );
}
