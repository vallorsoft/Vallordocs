'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useApi } from '@/hooks/use-api';
import type { SettingsResponse } from '@/lib/api/types';
import { useSession } from '@/components/session-provider';
import { PageHeader } from '@/components/layout/page-header';
import { DataState } from '@/components/data-state';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
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
 * Tenant overview (PRD 2. fejezet – Tenant; 4. fejezet – Tenant). Requires
 * `tenant.manage`. Presents the tenant identity together with a read-only summary
 * of the effective tenant configuration; edits are performed on the Settings
 * page, which this links to.
 */
export default function TenantPage() {
  const t = useTranslations();
  const { user } = useSession();
  const { data, error, loading, reload } =
    useApi<SettingsResponse>('/api/settings');

  return (
    <>
      <PageHeader title={t('nav.tenant')} description={t('tenant.subtitle')} />

      <DataState
        loading={loading}
        error={error}
        emptyMessage={t('tenant.subtitle')}
        onRetry={reload}
      >
        {data && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('tenant.identity')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label={t('tenant.tenantId')}
                  value={user?.tenantId ?? '–'}
                />
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t('tenant.ai')}
                  </span>
                  <span>
                    <Badge
                      variant={data.settings.aiEnabled ? 'success' : 'neutral'}
                    >
                      {data.settings.aiEnabled
                        ? t('tenant.aiEnabled')
                        : t('tenant.aiDisabled')}
                    </Badge>
                  </span>
                </div>
                <Field
                  label={t('settings.defaultLanguage')}
                  value={t(`languages.${data.settings.defaultLanguage}`)}
                />
                <Field
                  label={t('settings.defaultTimezone')}
                  value={data.settings.defaultTimezone}
                />
              </CardContent>
            </Card>

            <Link
              href="/settings"
              className={buttonVariants({ variant: 'outline' })}
            >
              {t('tenant.editSettings')}
            </Link>
          </div>
        )}
      </DataState>
    </>
  );
}
