'use client';

import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { useFormatting } from '@/hooks/use-formatting';
import type { DocumentsResponse } from '@/lib/api/types';
import { Card, CardContent } from '@/components/ui/card';
import { DataState } from '@/components/data-state';
import { StatusBadge } from '@/components/status-badge';

/**
 * Driver document list (PRD 4. fejezet – Driver: saját feltöltések megtekintése).
 * A compact, touch-friendly feed of the driver's documents with their AI/PDF
 * status.
 */
export default function DriverDocumentsPage() {
  const t = useTranslations();
  const fmt = useFormatting();
  const { data, error, loading, reload } =
    useApi<DocumentsResponse>('/api/documents');

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold tracking-tight">
        {t('driver.myDocuments')}
      </h1>

      <DataState
        loading={loading}
        error={error}
        isEmpty={(data?.documents.length ?? 0) === 0}
        emptyMessage={t('driver.noDocuments')}
        onRetry={reload}
      >
        <ul className="flex flex-col gap-3">
          {data?.documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">
                      {t(`docType.${doc.documentType}`)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fmt.dateTime(doc.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge kind="documentStatus" value={doc.status} />
                  <StatusBadge kind="aiStatus" value={doc.aiStatus} />
                </div>
              </CardContent>
            </Card>
          ))}
        </ul>
      </DataState>
    </div>
  );
}
