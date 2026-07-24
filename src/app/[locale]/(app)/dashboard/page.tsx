'use client';

import { useTranslations } from 'next-intl';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock,
  HardDrive,
  Upload,
  Users,
} from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import type { DashboardResponse } from '@/lib/api/types';
import { formatDuration, formatMegabytes, formatPercent } from '@/lib/format';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/stat-card';
import { DataState } from '@/components/data-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Admin dashboard (PRD 4. fejezet – Dashboard: mai/heti feltöltések, AI
 * sikerességi arány, átlagos feldolgozási idő, legaktívabb sofőrök, storage).
 */
export default function DashboardPage() {
  const t = useTranslations();
  const { data, error, loading, reload } =
    useApi<DashboardResponse>('/api/dashboard');
  const d = data?.dashboard;

  return (
    <>
      <PageHeader
        title={t('nav.dashboard')}
        description={t('dashboard.subtitle')}
      />
      <DataState
        loading={loading}
        error={error}
        emptyMessage={t('dashboard.empty')}
        onRetry={reload}
      >
        {d && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label={t('dashboard.todayUploads')}
                value={d.todayUploads}
                icon={Upload}
              />
              <StatCard
                label={t('dashboard.weekUploads')}
                value={d.weekUploads}
                icon={CalendarDays}
              />
              <StatCard
                label={t('dashboard.aiSuccessRate')}
                value={formatPercent(d.aiSuccessRate)}
                icon={CheckCircle2}
              />
              <StatCard
                label={t('dashboard.avgProcessing')}
                value={formatDuration(d.avgProcessingMs)}
                icon={Clock}
              />
              <StatCard
                label={t('dashboard.activeDrivers')}
                value={d.activeDrivers}
                icon={Activity}
              />
              <StatCard
                label={t('dashboard.storageUsage')}
                value={formatMegabytes(d.storageUsageMb)}
                icon={HardDrive}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden
                  />
                  {t('dashboard.topDrivers')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {d.topDrivers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.noDrivers')}
                  </p>
                ) : (
                  <ol className="flex flex-col divide-y divide-border">
                    {d.topDrivers.map((driver, index) => (
                      <li
                        key={driver.driverId}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {driver.driverId.slice(0, 8)}
                          </span>
                        </span>
                        <span className="font-medium tabular-nums">
                          {t('dashboard.documentCount', {
                            count: driver.count,
                          })}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DataState>
    </>
  );
}
