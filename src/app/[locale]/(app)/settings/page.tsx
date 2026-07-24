'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useApi } from '@/hooks/use-api';
import { apiFetch } from '@/lib/api/client';
import { errorMessageKey } from '@/lib/form';
import type { SettingsResponse } from '@/lib/api/types';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/layout/page-header';
import { DataState } from '@/components/data-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const LANGUAGES = ['hu', 'ro'];
const TIMEZONES = ['Europe/Budapest', 'Europe/Bucharest'];
const PDF_QUALITIES = ['standard', 'high'];

/**
 * Tenant settings (PRD 2. fejezet – Tenant beállítások; 5. fejezet – Retention
 * Policy). Requires `settings.manage`. Loads the effective settings, edits them,
 * and PUTs the validated payload back; numeric fields are coerced and the
 * optional storage limit is omitted when blank.
 */
export default function SettingsPage() {
  const t = useTranslations();
  const { toast } = useToast();
  const { data, error, loading, reload } =
    useApi<SettingsResponse>('/api/settings');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const form = new FormData(event.currentTarget);
    const storageLimit = String(form.get('storageLimitMb') ?? '').trim();

    const payload: Record<string, unknown> = {
      defaultLanguage: String(form.get('defaultLanguage') ?? 'hu'),
      defaultTimezone: String(form.get('defaultTimezone') ?? 'Europe/Budapest'),
      aiEnabled: form.get('aiEnabled') === 'on',
      pdfQuality: String(form.get('pdfQuality') ?? 'high'),
      documentRetentionDays: Number(form.get('documentRetentionDays')),
      auditRetentionDays: Number(form.get('auditRetentionDays')),
      logRetentionDays: Number(form.get('logRetentionDays')),
    };
    if (storageLimit !== '') payload.storageLimitMb = Number(storageLimit);

    try {
      await apiFetch('/api/settings', { method: 'PUT', json: payload });
      toast(t('settings.saved'), 'success');
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
        title={t('nav.settings')}
        description={t('settings.subtitle')}
      />

      <DataState
        loading={loading}
        error={error}
        emptyMessage={t('settings.subtitle')}
        onRetry={reload}
      >
        {data && (
          <form className="flex flex-col gap-6" onSubmit={onSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('settings.localization')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="defaultLanguage">
                    {t('settings.defaultLanguage')}
                  </Label>
                  <Select
                    id="defaultLanguage"
                    name="defaultLanguage"
                    defaultValue={data.settings.defaultLanguage}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {t(`languages.${lang}`)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="defaultTimezone">
                    {t('settings.defaultTimezone')}
                  </Label>
                  <Select
                    id="defaultTimezone"
                    name="defaultTimezone"
                    defaultValue={data.settings.defaultTimezone}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('settings.processing')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    name="aiEnabled"
                    defaultChecked={data.settings.aiEnabled}
                    className="h-4 w-4 rounded border-input"
                  />
                  {t('settings.aiEnabled')}
                </label>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pdfQuality">{t('settings.pdfQuality')}</Label>
                  <Select
                    id="pdfQuality"
                    name="pdfQuality"
                    defaultValue={data.settings.pdfQuality}
                  >
                    {PDF_QUALITIES.map((q) => (
                      <option key={q} value={q}>
                        {t(`settings.quality.${q}`)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="storageLimitMb">
                    {t('settings.storageLimit')}
                  </Label>
                  <Input
                    id="storageLimitMb"
                    name="storageLimitMb"
                    type="number"
                    min={1}
                    defaultValue={data.settings.storageLimitMb ?? ''}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t('settings.retention')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="documentRetentionDays">
                    {t('settings.documentRetention')}
                  </Label>
                  <Input
                    id="documentRetentionDays"
                    name="documentRetentionDays"
                    type="number"
                    min={1}
                    required
                    defaultValue={data.settings.documentRetentionDays}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="auditRetentionDays">
                    {t('settings.auditRetention')}
                  </Label>
                  <Input
                    id="auditRetentionDays"
                    name="auditRetentionDays"
                    type="number"
                    min={1}
                    required
                    defaultValue={data.settings.auditRetentionDays}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="logRetentionDays">
                    {t('settings.logRetention')}
                  </Label>
                  <Input
                    id="logRetentionDays"
                    name="logRetentionDays"
                    type="number"
                    min={1}
                    required
                    defaultValue={data.settings.logRetentionDays}
                  />
                </div>
              </CardContent>
            </Card>

            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {t('common.save')}
              </Button>
            </div>
          </form>
        )}
      </DataState>
    </>
  );
}
