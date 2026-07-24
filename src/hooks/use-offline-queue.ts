'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  drainUploads,
  enqueueUpload,
  pendingUploads,
  type DocumentUploadPayload,
} from '@/lib/offline/queue-store';
import { useOnline } from '@/hooks/use-online';

/**
 * Offline upload queue controller (PRD 4. fejezet – Offline működés, automatikus
 * szinkronizálás felhasználói beavatkozás nélkül).
 *
 * Exposes the pending count and a `submit` that either registers the document
 * immediately (online) or defers it to the persistent queue (offline). Whenever
 * connectivity returns it drains the queue automatically by replaying each
 * deferred registration against `/api/documents`.
 */
export interface OfflineQueue {
  pending: number;
  online: boolean;
  /** Registers now when online, otherwise queues for later. Returns 'queued'. */
  submit: (payload: DocumentUploadPayload) => Promise<'sent' | 'queued'>;
}

function deliver(payload: DocumentUploadPayload): Promise<unknown> {
  return apiFetch('/api/documents', { method: 'POST', json: payload });
}

export function useOfflineQueue(): OfflineQueue {
  const online = useOnline();
  const [pending, setPending] = useState(0);

  const refresh = useCallback(() => setPending(pendingUploads()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Drain automatically whenever connectivity returns.
  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    void drainUploads((payload) => deliver(payload).then(() => undefined))
      .catch(() => 0)
      .finally(() => {
        if (!cancelled) refresh();
      });
    return () => {
      cancelled = true;
    };
  }, [online, refresh]);

  const submit = useCallback(
    async (payload: DocumentUploadPayload): Promise<'sent' | 'queued'> => {
      if (online) {
        try {
          await deliver(payload);
          return 'sent';
        } catch {
          // Network hiccup despite `navigator.onLine`: fall through to queue.
        }
      }
      enqueueUpload(payload);
      refresh();
      return 'queued';
    },
    [online, refresh],
  );

  return { pending, online, submit };
}
