'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Cpu } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { useFormatting } from '@/hooks/use-formatting';
import { apiFetch, ApiError } from '@/lib/api/client';
import type { DocumentsResponse } from '@/lib/api/types';
import { useSession } from '@/components/session-provider';
import { useToast } from '@/components/ui/toast';
import { PERMISSIONS } from '@/modules/auth/rbac';
import { PageHeader } from '@/components/layout/page-header';
import { DataState } from '@/components/data-state';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const DOCUMENT_TYPES = [
  'cmr',
  'invoice',
  'pod',
  'delivery_note',
  'adr',
  'weight_ticket',
  'fuel_receipt',
  'toll_receipt',
  'customs',
  'other',
];
const DOCUMENT_STATUSES = [
  'draft',
  'uploaded',
  'processing',
  'ready',
  'failed',
];

/**
 * Documents list (PRD 4. fejezet – Dokumentum kezelő: lista, szűrés, státusz).
 * Filtering by type and status is client-side over the tenant-scoped list; users
 * with `ai.execute` can (re)enqueue AI restoration for a row.
 */
export default function DocumentsPage() {
  const t = useTranslations();
  const fmt = useFormatting();
  const { can } = useSession();
  const { toast } = useToast();
  const { data, error, loading, reload } =
    useApi<DocumentsResponse>('/api/documents');

  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [enqueuing, setEnqueuing] = useState<string | null>(null);

  const canRunAi = can(PERMISSIONS.AI_EXECUTE);

  const rows = useMemo(() => {
    const all = data?.documents ?? [];
    return all.filter(
      (doc) =>
        (!typeFilter || doc.documentType === typeFilter) &&
        (!statusFilter || doc.status === statusFilter),
    );
  }, [data, typeFilter, statusFilter]);

  async function runAi(documentId: string) {
    setEnqueuing(documentId);
    try {
      await apiFetch('/api/ai/jobs', {
        method: 'POST',
        json: { documentId },
      });
      toast(t('documents.aiQueued'), 'success');
      reload();
    } catch (err) {
      const key =
        err instanceof ApiError && t.has(err.messageKey)
          ? err.messageKey
          : 'errors.generic';
      toast(t(key), 'error');
    } finally {
      setEnqueuing(null);
    }
  }

  return (
    <>
      <PageHeader
        title={t('nav.documents')}
        description={t('documents.subtitle')}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="w-auto"
          aria-label={t('documents.filterType')}
        >
          <option value="">{t('documents.allTypes')}</option>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`docType.${type}`)}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-auto"
          aria-label={t('documents.filterStatus')}
        >
          <option value="">{t('documents.allStatuses')}</option>
          {DOCUMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`documentStatus.${status}`)}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <DataState
          loading={loading}
          error={error}
          isEmpty={rows.length === 0}
          emptyMessage={t('documents.empty')}
          onRetry={reload}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('documents.type')}</TableHead>
                <TableHead>{t('documents.status')}</TableHead>
                <TableHead>{t('documents.aiStatus')}</TableHead>
                <TableHead>{t('documents.created')}</TableHead>
                {canRunAi && <TableHead className="text-right" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    {t(`docType.${doc.documentType}`)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="documentStatus" value={doc.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="aiStatus" value={doc.aiStatus} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {fmt.dateTime(doc.createdAt)}
                  </TableCell>
                  {canRunAi && (
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={enqueuing === doc.id}
                        onClick={() => runAi(doc.id)}
                      >
                        <Cpu />
                        {t('documents.runAi')}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Card>
    </>
  );
}
