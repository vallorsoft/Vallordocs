'use client';

import { useTranslations } from 'next-intl';
import { Camera, Truck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useApi } from '@/hooks/use-api';
import { useOfflineQueue } from '@/hooks/use-offline-queue';
import type { DocumentsResponse, TripsResponse } from '@/lib/api/types';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataState } from '@/components/data-state';
import { StatusBadge } from '@/components/status-badge';

/**
 * Driver home (PRD 4. fejezet – Driver kezdőlap: aktív fuvarok, feltöltendő /
 * sikeres / feldolgozás alatti dokumentumok). A single prominent capture action
 * plus the driver's active trips and upload summary.
 */
export default function DriverHomePage() {
  const t = useTranslations();
  const { pending } = useOfflineQueue();
  const trips = useApi<TripsResponse>('/api/trips');
  const docs = useApi<DocumentsResponse>('/api/documents');

  const activeTrips = (trips.data?.trips ?? []).filter(
    (trip) => trip.status === 'planned' || trip.status === 'in_progress',
  );
  const documents = docs.data?.documents ?? [];
  const processing = documents.filter(
    (d) => d.aiStatus === 'processing' || d.aiStatus === 'queued',
  ).length;
  const ready = documents.filter((d) => d.status === 'ready').length;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/driver/capture"
        className={buttonVariants({ size: 'xl', className: 'w-full' })}
      >
        <Camera />
        {t('driver.captureCta')}
      </Link>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <span className="text-2xl font-semibold tabular-nums">
              {documents.length}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('driver.stats.total')}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <span className="text-2xl font-semibold tabular-nums">
              {processing}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('driver.stats.processing')}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <span className="text-2xl font-semibold tabular-nums">{ready}</span>
            <span className="text-xs text-muted-foreground">
              {t('driver.stats.ready')}
            </span>
          </CardContent>
        </Card>
      </div>

      {pending > 0 && (
        <p className="text-center text-sm text-amber-600 dark:text-amber-400">
          {t('driver.pendingSync', { count: pending })}
        </p>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('driver.activeTrips')}
        </h2>
        <DataState
          loading={trips.loading}
          error={trips.error}
          isEmpty={activeTrips.length === 0}
          emptyMessage={t('driver.noTrips')}
          onRetry={trips.reload}
        >
          <ul className="flex flex-col gap-3">
            {activeTrips.map((trip) => (
              <Card key={trip.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Truck
                      className="h-5 w-5 text-muted-foreground"
                      aria-hidden
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{trip.tripNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {[trip.originPlace, trip.destination]
                          .filter(Boolean)
                          .join(' → ') || '–'}
                      </span>
                    </div>
                  </div>
                  <StatusBadge kind="tripStatus" value={trip.status} />
                </CardContent>
              </Card>
            ))}
          </ul>
        </DataState>
      </div>
    </div>
  );
}
