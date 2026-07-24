import {
  dueItems,
  enqueue,
  markDone,
  markFailed,
  markInFlight,
  pendingCount,
  type SyncItem,
} from '@/modules/offline/sync-queue';

/**
 * Browser-persisted offline upload queue (PRD 4. fejezet – Offline működés,
 * háttérszinkronizálás, automatikus újrapróbálkozás).
 *
 * A thin `localStorage` persistence layer over the pure, unit-tested queue logic
 * in the offline module. Captures made without connectivity are appended here as
 * document-registration payloads and replayed automatically when the connection
 * returns, with the module's exponential-backoff/dead-letter policy.
 */

/** A deferred document registration (metadata; the binary flow lands later). */
export interface DocumentUploadPayload {
  documentType: string;
  tripId?: string;
  driverId?: string;
}

interface PersistedState {
  queue: SyncItem[];
  payloads: Record<string, DocumentUploadPayload>;
}

const STORAGE_KEY = 'vallordocs.offlineQueue';

function read(): PersistedState {
  if (typeof window === 'undefined') return { queue: [], payloads: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { queue: [], payloads: {} };
    const parsed = JSON.parse(raw) as PersistedState;
    if (Array.isArray(parsed.queue) && parsed.payloads) return parsed;
  } catch {
    // Corrupt state resets to empty rather than throwing.
  }
  return { queue: [], payloads: {} };
}

function write(state: PersistedState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Generates a queue item id, using `crypto.randomUUID` when available. */
function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Current number of pending (not-yet-delivered) items. */
export function pendingUploads(): number {
  return pendingCount(read().queue);
}

/** Appends a document-registration payload to the offline queue. */
export function enqueueUpload(payload: DocumentUploadPayload): void {
  const state = read();
  const id = newId();
  const now = Date.now();
  const item: SyncItem = {
    id,
    kind: 'document_upload',
    createdAt: now,
    attempts: 0,
    nextAttemptAt: now,
    status: 'pending',
    payloadRef: id,
  };
  write({
    queue: enqueue(state.queue, item),
    payloads: { ...state.payloads, [id]: payload },
  });
}

/**
 * Drains all due items by invoking `deliver` for each. Successful items are
 * marked done and their payloads dropped; failures are rescheduled with backoff
 * (and dead-lettered after the attempt budget). Returns the number delivered.
 */
export async function drainUploads(
  deliver: (payload: DocumentUploadPayload) => Promise<void>,
  now: number = Date.now(),
): Promise<number> {
  let state = read();
  const due = dueItems(state.queue, now);
  let delivered = 0;

  for (const item of due) {
    const payload = state.payloads[item.payloadRef];
    if (!payload) {
      // Orphaned item (payload lost): mark done to drop it.
      state = { ...state, queue: markDone(state.queue, item.id) };
      continue;
    }
    state = { ...state, queue: markInFlight(state.queue, item.id) };
    write(state);
    try {
      await deliver(payload);
      const { [item.payloadRef]: _dropped, ...rest } = state.payloads;
      state = { queue: markDone(state.queue, item.id), payloads: rest };
      delivered += 1;
    } catch {
      state = { ...state, queue: markFailed(state.queue, item.id, Date.now()) };
    }
    write(state);
  }

  return delivered;
}
