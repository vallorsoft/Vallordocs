'use client';

import { useTranslations } from 'next-intl';
import { useApi } from '@/hooks/use-api';
import type { DashboardResponse } from '@/lib/api/types';
import { formatDuration, formatMegabytes, formatPercent } from '@/lib/format';
import { PageHeader } from '@/components/layout/page-header';
import { DataState } from '@/components/data-state';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/**
 * Reports (PRD 4. fejezet – Riportok; 5. fejezet – Metrikák). A tabular KPI
 * report over the same tenant-scoped metrics that back the dashboard, framed for
 * reading and printing rather than at-a-glance monitoring.
 */
export default function ReportsPage() {
  const t = useTranslations();
  const { data, error, loading, reload } =
    useApi<DashboardResponse>('/api/dashboard');
  const d = data?.dashboard;

  const rows = d
    ? [
        { label: t('dashboard.todayUploads'), value: String(d.todayUploads) },
        { label: t('dashboard.weekUploads'), value: String(d.weekUploads) },
        {
          label: t('dashboard.aiSuccessRate'),
          value: formatPercent(d.aiSuccessRate),
        },
        {
          label: t('dashboard.avgProcessing'),
          value: formatDuration(d.avgProcessingMs),
        },
        {
          label: t('dashboard.activeDrivers'),
          value: String(d.activeDrivers),
        },
        {
          label: t('dashboard.storageUsage'),
          value: formatMegabytes(d.storageUsageMb),
        },
      ]
    : [];

  return (
    <>
      <PageHeader
        title={t('nav.reports')}
        description={t('reports.subtitle')}
      />

      <Card>
        <DataState
          loading={loading}
          error={error}
          emptyMessage={t('reports.subtitle')}
          onRetry={reload}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.metric')}</TableHead>
                <TableHead className="text-right">
                  {t('reports.value')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Card>
    </>
  );
}
