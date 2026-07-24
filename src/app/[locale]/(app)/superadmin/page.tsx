'use client';

import { useTranslations } from 'next-intl';
import { Building2, FileText, ShieldAlert, Truck, Users } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { useFormatting } from '@/hooks/use-formatting';
import type { SuperadminOverviewResponse } from '@/lib/api/types';
import { PERMISSIONS } from '@/modules/auth/rbac';
import { RequireAuth } from '@/components/auth/require-auth';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/stat-card';
import { DataState } from '@/components/data-state';
import { Badge } from '@/components/ui/badge';
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
 * Super-admin (platform) console (PRD 2. fejezet – Platform szerepkörök).
 *
 * A distinct, platform-level area reserved for holders of `platform.manage`.
 * Unlike the tenant-scoped admin pages, it presents a cross-tenant overview of
 * the whole platform. Access is guarded both here (client-side, for UX) and by
 * the API it calls (server-side, the real boundary).
 */
export default function SuperadminPage() {
  const t = useTranslations();
  const fmt = useFormatting();
  const { data, error, loading, reload } = useApi<SuperadminOverviewResponse>(
    '/api/superadmin/overview',
  );
  const overview = data?.overview;

  return (
    <RequireAuth permission={PERMISSIONS.PLATFORM_MANAGE}>
      <PageHeader
        title={t('nav.superadmin')}
        description={t('superadmin.subtitle')}
      />

      <DataState
        loading={loading}
        error={error}
        emptyMessage={t('superadmin.empty')}
        onRetry={reload}
      >
        {overview && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label={t('superadmin.tenants')}
                value={overview.totals.tenants}
                icon={Building2}
                hint={t('superadmin.activeTenants', {
                  count: overview.totals.activeTenants,
                })}
              />
              <StatCard
                label={t('superadmin.users')}
                value={overview.totals.users}
                icon={Users}
              />
              <StatCard
                label={t('superadmin.documents')}
                value={overview.totals.documents}
                icon={FileText}
              />
              <StatCard
                label={t('superadmin.trips')}
                value={overview.totals.trips}
                icon={Truck}
              />
            </div>

            <Card>
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <ShieldAlert
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
                <h2 className="text-base font-semibold">
                  {t('superadmin.tenantsTitle')}
                </h2>
              </div>
              {overview.tenants.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground">
                  {t('superadmin.noTenants')}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('superadmin.company')}</TableHead>
                      <TableHead>{t('superadmin.country')}</TableHead>
                      <TableHead>{t('superadmin.status')}</TableHead>
                      <TableHead className="text-right">
                        {t('superadmin.users')}
                      </TableHead>
                      <TableHead className="text-right">
                        {t('superadmin.documents')}
                      </TableHead>
                      <TableHead className="text-right">
                        {t('superadmin.drivers')}
                      </TableHead>
                      <TableHead>{t('superadmin.created')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">
                          {tenant.companyName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tenant.country ?? '–'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={tenant.isActive ? 'success' : 'neutral'}
                          >
                            {tenant.isActive
                              ? t('superadmin.active')
                              : t('superadmin.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {tenant.userCount}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {tenant.documentCount}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {tenant.driverCount}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {fmt.date(tenant.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        )}
      </DataState>
    </RequireAuth>
  );
}
