'use client';

import { useTranslations } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { useFormatting } from '@/hooks/use-formatting';
import type { AiJobsResponse } from '@/lib/api/types';
import { formatDuration } from '@/lib/format';
import { PageHeader } from '@/components/layout/page-header';
import { DataState } from '@/components/data-state';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
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
 * AI processing queue (PRD 3. fejezet – Háttérfeldolgozás, naplózás; 4. fejezet –
 * AI Queue). A monitor of restoration jobs: status, provider/model, duration and
 * retry count, with a manual refresh.
 */
export default function AiQueuePage() {
  const t = useTranslations();
  const fmt = useFormatting();
  const { data, error, loading, reload } =
    useApi<AiJobsResponse>('/api/ai/jobs');

  return (
    <>
      <PageHeader
        title={t('nav.aiQueue')}
        description={t('aiQueue.subtitle')}
        actions={
          <Button variant="outline" onClick={reload}>
            <RefreshCw />
            {t('aiQueue.refresh')}
          </Button>
        }
      />

      <Card>
        <DataState
          loading={loading}
          error={error}
          isEmpty={(data?.jobs.length ?? 0) === 0}
          emptyMessage={t('aiQueue.empty')}
          onRetry={reload}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('aiQueue.document')}</TableHead>
                <TableHead>{t('aiQueue.status')}</TableHead>
                <TableHead>{t('aiQueue.provider')}</TableHead>
                <TableHead>{t('aiQueue.duration')}</TableHead>
                <TableHead>{t('aiQueue.attempts')}</TableHead>
                <TableHead>{t('aiQueue.created')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs">
                    {job.documentId.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="aiStatus" value={job.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.provider}
                    {job.model ? ` · ${job.model}` : ''}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {job.durationMs ? formatDuration(job.durationMs) : '–'}
                  </TableCell>
                  <TableCell className="tabular-nums">{job.attempts}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {fmt.dateTime(job.createdAt)}
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
