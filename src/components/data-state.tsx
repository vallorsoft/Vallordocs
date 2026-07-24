'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

/**
 * Shared async-view states (PRD 4. fejezet – Vizuális visszajelzés: betöltés,
 * hiba, üres lista). Centralises the loading spinner, translated error message
 * with retry, and empty-state so every data view renders them identically.
 */
export function LoadingState() {
  const t = useTranslations('common');
  return (
    <div
      className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Spinner />
      {t('loading')}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry?: () => void;
}) {
  const t = useTranslations();
  const message = t.has(error.messageKey)
    ? t(error.messageKey)
    : t('errors.generic');
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/**
 * Renders the right state for an async view: spinner while loading, a translated
 * error with optional retry, an empty-state when there are no rows, otherwise the
 * children.
 */
export function DataState({
  loading,
  error,
  isEmpty,
  emptyMessage,
  onRetry,
  children,
}: {
  loading: boolean;
  error: ApiError | null;
  isEmpty?: boolean;
  emptyMessage: string;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isEmpty) return <EmptyState message={emptyMessage} />;
  return <>{children}</>;
}
