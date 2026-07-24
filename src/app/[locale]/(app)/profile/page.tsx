'use client';

import { useTranslations } from 'next-intl';
import { useApi } from '@/hooks/use-api';
import type { MeDto } from '@/lib/api/types';
import { PageHeader } from '@/components/layout/page-header';
import { DataState } from '@/components/data-state';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/** A labelled read-only field row. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

/**
 * Profile view (PRD 2. fejezet – Felhasználó profil). Shows the caller's own
 * identity, localisation preferences, status and effective roles from `/api/me`.
 */
export default function ProfilePage() {
  const t = useTranslations();
  const { data, error, loading, reload } = useApi<MeDto>('/api/me');

  return (
    <>
      <PageHeader
        title={t('nav.profile')}
        description={t('profile.subtitle')}
      />

      <DataState
        loading={loading}
        error={error}
        emptyMessage={t('profile.subtitle')}
        onRetry={reload}
      >
        {data && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('profile.identity')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('profile.name')} value={data.name} />
                <Field label={t('profile.email')} value={data.email} />
                <Field label={t('profile.phone')} value={data.phone ?? '–'} />
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t('profile.status')}
                  </span>
                  <span>
                    <StatusBadge kind="userStatus" value={data.status} />
                  </span>
                </div>
                <Field
                  label={t('profile.language')}
                  value={t(`languages.${data.language}`)}
                />
                <Field
                  label={t('profile.timezone')}
                  value={data.timezone.replace('_', '/')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('profile.roles')}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {data.roles.map((role) => (
                  <Badge key={role} variant="neutral">
                    {t.has(`roles.${role}`) ? t(`roles.${role}`) : role}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </DataState>
    </>
  );
}
