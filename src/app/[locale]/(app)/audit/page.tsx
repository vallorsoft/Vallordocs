'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { useFormatting } from '@/hooks/use-formatting';
import type { AuditResponse } from '@/lib/api/types';
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
 * Audit trail (PRD 5. fejezet – Audit: nem módosítható, csak olvasható). A
 * read-only, tenant-scoped view of recorded events with actor, action, target
 * and outcome.
 */
export default function AuditPage() {
  const t = useTranslations();
  const fmt = useFormatting();
  const { data, error, loading, reload } = useApi<AuditResponse>('/api/audit');

  return (
    <>
      <PageHeader title={t('nav.audit')} description={t('audit.subtitle')} />

      <Card>
        <DataState
          loading={loading}
          error={error}
          isEmpty={(data?.entries.length ?? 0) === 0}
          emptyMessage={t('audit.empty')}
          onRetry={reload}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('audit.time')}</TableHead>
                <TableHead>{t('audit.action')}</TableHead>
                <TableHead>{t('audit.entity')}</TableHead>
                <TableHead>{t('audit.ip')}</TableHead>
                <TableHead>{t('audit.result')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {fmt.dateTime(entry.createdAt)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {entry.action}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.entity ?? '–'}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {entry.ipAddress ?? '–'}
                  </TableCell>
                  <TableCell>
                    {entry.success ? (
                      <CheckCircle2
                        className="h-4 w-4 text-emerald-500"
                        aria-label={t('audit.success')}
                      />
                    ) : (
                      <XCircle
                        className="h-4 w-4 text-destructive"
                        aria-label={t('audit.failure')}
                      />
                    )}
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
