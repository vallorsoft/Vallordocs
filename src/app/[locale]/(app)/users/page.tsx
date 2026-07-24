'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { apiFetch } from '@/lib/api/client';
import { compactStrings, errorMessageKey } from '@/lib/form';
import type { UsersResponse } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/layout/page-header';
import { DataState } from '@/components/data-state';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
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

const ROLE_NAMES = [
  'platform_owner',
  'platform_admin',
  'tenant_admin',
  'dispatcher',
  'office_user',
  'driver',
  'read_only',
];
const LANGUAGES = ['hu', 'ro'];
const TIMEZONES = ['Europe/Budapest', 'Europe/Bucharest'];
const USER_STATUSES = ['active', 'invited', 'suspended', 'disabled'];

/**
 * Users list + invite (PRD 2. fejezet – Felhasználók, szerepkörök; 4. fejezet –
 * Felhasználók). The whole page requires `user.manage`, enforced server-side and
 * reflected by the sidebar. Roles are chosen as a multi-select of RBAC roles.
 */
export default function UsersPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const { data, error, loading, reload } = useApi<UsersResponse>('/api/users');

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const form = new FormData(event.currentTarget);
    const roles = form.getAll('roles').map(String);
    const payload = {
      ...compactStrings({
        name: String(form.get('name') ?? ''),
        email: String(form.get('email') ?? ''),
        phone: String(form.get('phone') ?? ''),
        password: String(form.get('password') ?? ''),
      }),
      language: String(form.get('language') ?? 'hu'),
      timezone: String(form.get('timezone') ?? 'Europe/Budapest'),
      status: String(form.get('status') ?? 'invited'),
      roles,
    };

    if (roles.length === 0) {
      setFormError(t('validation.rolesRequired'));
      setSubmitting(false);
      return;
    }

    try {
      await apiFetch('/api/users', { method: 'POST', json: payload });
      toast(t('users.created'), 'success');
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
        title={t('nav.users')}
        description={t('users.subtitle')}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            {t('users.create')}
          </Button>
        }
      />

      <Card>
        <DataState
          loading={loading}
          error={error}
          isEmpty={(data?.users.length ?? 0) === 0}
          emptyMessage={t('users.empty')}
          onRetry={reload}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('users.name')}</TableHead>
                <TableHead>{t('users.email')}</TableHead>
                <TableHead>{t('users.roles')}</TableHead>
                <TableHead>{t('users.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="neutral">
                          {t(`roles.${role}`)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="userStatus" value={user.status} />
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
        title={t('users.create')}
      >
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t('users.name')}</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t('users.email')}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{t('users.phone')}</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t('users.password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="language">{t('profile.language')}</Label>
              <Select id="language" name="language" defaultValue="hu">
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {t(`languages.${lang}`)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="timezone">{t('profile.timezone')}</Label>
              <Select
                id="timezone"
                name="timezone"
                defaultValue="Europe/Budapest"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">{t('users.status')}</Label>
              <Select id="status" name="status" defaultValue="invited">
                {USER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`userStatus.${status}`)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t('users.roles')}
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ROLE_NAMES.map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="roles"
                    value={role}
                    className="h-4 w-4 rounded border-input"
                  />
                  {t(`roles.${role}`)}
                </label>
              ))}
            </div>
          </fieldset>

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
