'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Plus } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { apiFetch } from '@/lib/api/client';
import { compactStrings, errorMessageKey } from '@/lib/form';
import type { DriversResponse } from '@/lib/api/types';
import { useSession } from '@/components/session-provider';
import { useToast } from '@/components/ui/toast';
import { PERMISSIONS } from '@/modules/auth/rbac';
import { PageHeader } from '@/components/layout/page-header';
import { DataState } from '@/components/data-state';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const DRIVER_STATUSES = ['active', 'inactive', 'suspended'];

/**
 * Drivers list + create (PRD 2. fejezet – Sofőr profil; 4. fejezet – Sofőrök).
 * The create form mirrors the backend `driverSchema` (driver code is normalised
 * server-side).
 */
export default function DriversPage() {
  const t = useTranslations();
  const { can } = useSession();
  const { toast } = useToast();
  const { data, error, loading, reload } =
    useApi<DriversResponse>('/api/drivers');

  const canWrite = can(PERMISSIONS.DRIVER_WRITE);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      ...compactStrings({
        name: String(form.get('name') ?? ''),
        driverCode: String(form.get('driverCode') ?? ''),
        phone: String(form.get('phone') ?? ''),
        email: String(form.get('email') ?? ''),
        licenseNumber: String(form.get('licenseNumber') ?? ''),
        status: String(form.get('status') ?? 'active'),
      }),
      adrCertified: form.get('adrCertified') === 'on',
    };

    try {
      await apiFetch('/api/drivers', { method: 'POST', json: payload });
      toast(t('drivers.created'), 'success');
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(t(errorMessageKey(err, (key) => t.has(key))));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title={t('nav.drivers')}
        description={t('drivers.subtitle')}
        actions={
          canWrite && (
            <Button onClick={() => setOpen(true)}>
              <Plus />
              {t('drivers.create')}
            </Button>
          )
        }
      />

      <Card>
        <DataState
          loading={loading}
          error={error}
          isEmpty={(data?.drivers.length ?? 0) === 0}
          emptyMessage={t('drivers.empty')}
          onRetry={reload}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('drivers.name')}</TableHead>
                <TableHead>{t('drivers.code')}</TableHead>
                <TableHead>{t('drivers.phone')}</TableHead>
                <TableHead>{t('drivers.adr')}</TableHead>
                <TableHead>{t('drivers.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {driver.driverCode}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {driver.phone ?? '–'}
                  </TableCell>
                  <TableCell>
                    {driver.adrCertified ? (
                      <Check
                        className="h-4 w-4 text-emerald-500"
                        aria-label={t('drivers.adr')}
                      />
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="driverStatus" value={driver.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('drivers.create')}
      >
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{t('drivers.name')}</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="driverCode">{t('drivers.code')}</Label>
              <Input id="driverCode" name="driverCode" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{t('drivers.phone')}</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t('drivers.email')}</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="licenseNumber">{t('drivers.license')}</Label>
              <Input id="licenseNumber" name="licenseNumber" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="adrCertified"
              className="h-4 w-4 rounded border-input"
            />
            {t('drivers.adrCertified')}
          </label>
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">{t('drivers.status')}</Label>
            <Select id="status" name="status" defaultValue="active">
              {DRIVER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`driverStatus.${status}`)}
                </option>
              ))}
            </Select>
          </div>

          {formError && (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
