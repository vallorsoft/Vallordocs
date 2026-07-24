'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { useFormatting } from '@/hooks/use-formatting';
import { apiFetch } from '@/lib/api/client';
import { compactStrings, errorMessageKey } from '@/lib/form';
import type { TripsResponse } from '@/lib/api/types';
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

const TRIP_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled'];

/**
 * Trips list + create (PRD 4. fejezet – Fuvarok; 7. fejezet – Trips). The create
 * form mirrors the backend `tripSchema`; validation errors returned by the API
 * surface as a translated field message.
 */
export default function TripsPage() {
  const t = useTranslations();
  const fmt = useFormatting();
  const { can } = useSession();
  const { toast } = useToast();
  const { data, error, loading, reload } = useApi<TripsResponse>('/api/trips');

  const canWrite = can(PERMISSIONS.TRIP_WRITE);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const form = new FormData(event.currentTarget);
    const payload = compactStrings({
      tripNumber: String(form.get('tripNumber') ?? ''),
      orderNumber: String(form.get('orderNumber') ?? ''),
      originPlace: String(form.get('originPlace') ?? ''),
      destination: String(form.get('destination') ?? ''),
      departureAt: String(form.get('departureAt') ?? ''),
      arrivalAt: String(form.get('arrivalAt') ?? ''),
      status: String(form.get('status') ?? 'planned'),
    });

    try {
      await apiFetch('/api/trips', { method: 'POST', json: payload });
      toast(t('trips.created'), 'success');
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
        title={t('nav.trips')}
        description={t('trips.subtitle')}
        actions={
          canWrite && (
            <Button onClick={() => setOpen(true)}>
              <Plus />
              {t('trips.create')}
            </Button>
          )
        }
      />

      <Card>
        <DataState
          loading={loading}
          error={error}
          isEmpty={(data?.trips.length ?? 0) === 0}
          emptyMessage={t('trips.empty')}
          onRetry={reload}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('trips.tripNumber')}</TableHead>
                <TableHead>{t('trips.route')}</TableHead>
                <TableHead>{t('trips.status')}</TableHead>
                <TableHead>{t('trips.created')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">
                    {trip.tripNumber}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {[trip.originPlace, trip.destination]
                      .filter(Boolean)
                      .join(' → ') || '–'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="tripStatus" value={trip.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {fmt.dateTime(trip.createdAt)}
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
        title={t('trips.create')}
      >
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tripNumber">{t('trips.tripNumber')}</Label>
            <Input id="tripNumber" name="tripNumber" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="orderNumber">{t('trips.orderNumber')}</Label>
            <Input id="orderNumber" name="orderNumber" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="originPlace">{t('trips.origin')}</Label>
              <Input id="originPlace" name="originPlace" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="destination">{t('trips.destination')}</Label>
              <Input id="destination" name="destination" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="departureAt">{t('trips.departure')}</Label>
              <Input
                id="departureAt"
                name="departureAt"
                type="datetime-local"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="arrivalAt">{t('trips.arrival')}</Label>
              <Input id="arrivalAt" name="arrivalAt" type="datetime-local" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">{t('trips.status')}</Label>
            <Select id="status" name="status" defaultValue="planned">
              {TRIP_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`tripStatus.${status}`)}
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
