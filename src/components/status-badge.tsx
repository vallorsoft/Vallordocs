'use client';

import { useTranslations } from 'next-intl';
import { Badge, type BadgeProps } from '@/components/ui/badge';

/**
 * Status badge (PRD 4. fejezet – AI státusz, státuszok). Maps the domain enum
 * values (document / AI job / trip / driver / user status) to a translated label
 * and a semantic colour, so status reads identically everywhere it appears.
 */
type StatusKind =
  'documentStatus' | 'aiStatus' | 'tripStatus' | 'driverStatus' | 'userStatus';

type Variant = NonNullable<BadgeProps['variant']>;

/** Semantic colour per status value, keyed by kind. Unknown → neutral. */
const VARIANTS: Record<StatusKind, Record<string, Variant>> = {
  documentStatus: {
    draft: 'neutral',
    uploaded: 'info',
    processing: 'warning',
    ready: 'success',
    failed: 'danger',
  },
  aiStatus: {
    queued: 'info',
    processing: 'warning',
    generating_pdf: 'warning',
    done: 'success',
    failed: 'danger',
    retrying: 'warning',
    cancelled: 'neutral',
  },
  tripStatus: {
    planned: 'neutral',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'neutral',
  },
  driverStatus: {
    active: 'success',
    inactive: 'neutral',
    suspended: 'danger',
  },
  userStatus: {
    active: 'success',
    invited: 'info',
    suspended: 'warning',
    disabled: 'danger',
  },
};

export function StatusBadge({
  kind,
  value,
}: {
  kind: StatusKind;
  value: string;
}) {
  const t = useTranslations(kind);
  const variant = VARIANTS[kind][value] ?? 'neutral';
  // `t.has` guards against enum values without a translation, degrading to the
  // raw value rather than throwing.
  const label = t.has(value) ? t(value) : value;
  return <Badge variant={variant}>{label}</Badge>;
}
