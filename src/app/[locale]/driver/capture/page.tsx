'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { useOfflineQueue } from '@/hooks/use-offline-queue';
import { assessPhoto } from '@/lib/image-quality';
import type { TripsResponse } from '@/lib/api/types';
import type { QualityIssue } from '@/modules/documents/quality';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const DOCUMENT_TYPES = [
  'cmr',
  'invoice',
  'pod',
  'delivery_note',
  'adr',
  'weight_ticket',
  'fuel_receipt',
  'toll_receipt',
  'customs',
  'other',
];

/**
 * Driver capture flow (PRD 3./4. fejezet – Fotó készítése, helyi
 * minőségellenőrzés, feltöltés; offline sorba állítás). Choose a trip and
 * document type, capture a photo, run the on-device quality gate, and submit —
 * registering immediately when online or queueing for automatic sync offline.
 */
export default function CapturePage() {
  const t = useTranslations();
  const { toast } = useToast();
  const queue = useOfflineQueue();
  const { data } = useApi<TripsResponse>('/api/trips');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tripId, setTripId] = useState('');
  const [documentType, setDocumentType] = useState('cmr');
  const [preview, setPreview] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setChecking(true);
    setIssues([]);
    setAccepted(false);
    setPreview(URL.createObjectURL(file));
    try {
      const result = await assessPhoto(file);
      setIssues(result.issues);
      setAccepted(result.acceptable);
    } catch {
      // A photo we cannot decode cannot be accepted.
      setIssues(['low_resolution']);
      setAccepted(false);
    } finally {
      setChecking(false);
    }
  }

  function reset() {
    setPreview(null);
    setIssues([]);
    setAccepted(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function onSubmit() {
    setSubmitting(true);
    try {
      const result = await queue.submit({
        documentType,
        ...(tripId ? { tripId } : {}),
      });
      toast(
        result === 'sent' ? t('driver.uploadSent') : t('driver.uploadQueued'),
        'success',
      );
      reset();
    } catch {
      toast(t('errors.generic'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="trip">{t('driver.selectTrip')}</Label>
        <Select
          id="trip"
          value={tripId}
          onChange={(event) => setTripId(event.target.value)}
        >
          <option value="">{t('driver.noTrip')}</option>
          {data?.trips.map((trip) => (
            <option key={trip.id} value={trip.id}>
              {trip.tripNumber}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="docType">{t('driver.selectType')}</Label>
        <Select
          id="docType"
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value)}
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`docType.${type}`)}
            </option>
          ))}
        </Select>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileSelected}
      />

      {!preview ? (
        <Button
          size="xl"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera />
          {t('driver.takePhoto')}
        </Button>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={t('driver.previewAlt')}
              className="max-h-80 w-full rounded-md object-contain"
            />

            {checking && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('driver.checking')}
              </p>
            )}

            {!checking && accepted && (
              <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {t('driver.qualityOk')}
              </p>
            )}

            {!checking && issues.length > 0 && (
              <div className="flex flex-col gap-2 rounded-md bg-amber-500/10 p-3">
                <p className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  {t('driver.qualityIssues')}
                </p>
                <ul className="list-inside list-disc text-sm text-amber-700 dark:text-amber-300">
                  {issues.map((issue) => (
                    <li key={issue}>{t(`quality.${issue}`)}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                {t('driver.retake')}
              </Button>
              <Button
                className="flex-1"
                disabled={!accepted || submitting}
                onClick={onSubmit}
              >
                {submitting && <Loader2 className="animate-spin" />}
                {queue.online ? t('driver.upload') : t('driver.queue')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
