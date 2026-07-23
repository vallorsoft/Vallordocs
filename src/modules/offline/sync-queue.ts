/**
 * Offline-first sync queue (PRD 4. fejezet – Offline működés, Background Sync,
 * PWA; 3. fejezet – Újrapróbálható feldolgozás, Dead Letter Queue).
 *
 * The Driver PWA captures documents even with no connectivity. Each capture is
 * appended to this queue as a {@link SyncItem}; the service worker's
 * Background Sync handler drains it on reconnect and replays uploads WITHOUT
 * any user intervention. Failed replays are rescheduled with a deterministic
 * exponential backoff and, after a bounded number of attempts, moved to a
 * permanent `failed` state (dead-letter) for later inspection.
 *
 * Every function here is PURE and deterministic: inputs are never mutated and a
 * fresh array/object is always returned. This makes the queue trivially
 * testable and safe to persist/rehydrate from IndexedDB inside the worker.
 */

/** Kinds of work the queue can hold. Only document uploads for now. */
export type SyncItemKind = 'document_upload';

/** Lifecycle state of a queued item. */
export type SyncItemStatus = 'pending' | 'in_flight' | 'failed' | 'done';

/**
 * A single unit of deferred work. `payloadRef` points at the captured document
 * stored out-of-band (e.g. IndexedDB blob key) so the queue itself stays small
 * and cheap to serialize.
 */
export interface SyncItem {
  id: string;
  kind: SyncItemKind;
  /** Epoch millis when the item was first enqueued. Drives FIFO ordering. */
  createdAt: number;
  /** Number of delivery attempts already made. */
  attempts: number;
  /** Epoch millis before which the item must not be retried. */
  nextAttemptAt: number;
  status: SyncItemStatus;
  payloadRef: string;
}

/** Tunables for the retry/backoff schedule. All overridable per call. */
export interface BackoffOptions {
  /** Base delay used as the first backoff step. */
  baseDelayMs: number;
  /** Upper bound for any single backoff step. */
  maxDelayMs: number;
  /** Attempts allowed before an item is dead-lettered permanently. */
  maxAttempts: number;
}

/** Default first backoff step (PRD 3. fejezet – Újrapróbálható feldolgozás). */
export const DEFAULT_BASE_DELAY_MS = 2000;
/** Default cap for a single backoff step (5 minutes). */
export const DEFAULT_MAX_DELAY_MS = 300000;
/** Default attempts before dead-lettering (PRD 3. – Dead Letter Queue). */
export const DEFAULT_MAX_ATTEMPTS = 5;

const DEFAULT_BACKOFF_OPTIONS: BackoffOptions = {
  baseDelayMs: DEFAULT_BASE_DELAY_MS,
  maxDelayMs: DEFAULT_MAX_DELAY_MS,
  maxAttempts: DEFAULT_MAX_ATTEMPTS,
};

/**
 * Appends `item` to the queue. Idempotent: if an item with the same id already
 * exists the queue is returned unchanged, so a double-enqueue (e.g. a retried
 * capture handler) can never create duplicates.
 */
export function enqueue(
  queue: readonly SyncItem[],
  item: SyncItem,
): SyncItem[] {
  if (queue.some((existing) => existing.id === item.id)) {
    return [...queue];
  }
  return [...queue, { ...item }];
}

/**
 * Returns the `pending` items that are due at `now` (nextAttemptAt <= now), in
 * FIFO order (by createdAt, then id as a stable tie-breaker). These are the
 * items the Background Sync handler should attempt this cycle.
 */
export function dueItems(queue: readonly SyncItem[], now: number): SyncItem[] {
  return queue
    .filter((item) => item.status === 'pending' && item.nextAttemptAt <= now)
    .slice()
    .sort((a, b) => {
      if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
}

/**
 * Internal helper: returns a new queue with the matching item replaced by the
 * result of `update`. Non-matching items and their references are preserved.
 */
function replaceItem(
  queue: readonly SyncItem[],
  id: string,
  update: (item: SyncItem) => SyncItem,
): SyncItem[] {
  return queue.map((item) => (item.id === id ? update({ ...item }) : item));
}

/** Marks an item as `in_flight` (a delivery attempt has started). */
export function markInFlight(
  queue: readonly SyncItem[],
  id: string,
): SyncItem[] {
  return replaceItem(queue, id, (item) => ({ ...item, status: 'in_flight' }));
}

/** Marks an item as successfully delivered (`done`). */
export function markDone(queue: readonly SyncItem[], id: string): SyncItem[] {
  return replaceItem(queue, id, (item) => ({ ...item, status: 'done' }));
}

/**
 * Records a failed delivery attempt and reschedules the item.
 *
 * The next attempt is scheduled with a deterministic, jitter-free exponential
 * backoff: `nextAttemptAt = now + min(baseDelayMs * 2^attempts, maxDelayMs)`,
 * evaluated against the pre-increment attempt count. The attempt counter is
 * then incremented. Once `attempts >= maxAttempts` the item is dead-lettered by
 * flipping its status to `failed` permanently; otherwise it returns to
 * `pending` for the next cycle.
 */
export function markFailed(
  queue: readonly SyncItem[],
  id: string,
  now: number,
  opts: Partial<BackoffOptions> = {},
): SyncItem[] {
  const { baseDelayMs, maxDelayMs, maxAttempts } = {
    ...DEFAULT_BACKOFF_OPTIONS,
    ...opts,
  };

  return replaceItem(queue, id, (item) => {
    const delay = Math.min(baseDelayMs * 2 ** item.attempts, maxDelayMs);
    const attempts = item.attempts + 1;
    const exhausted = attempts >= maxAttempts;
    return {
      ...item,
      attempts,
      nextAttemptAt: now + delay,
      status: exhausted ? 'failed' : 'pending',
    };
  });
}

/**
 * Selector: items that exhausted their retry budget and now sit in the
 * dead-letter state (PRD 3. fejezet – Dead Letter Queue).
 */
export function deadLettered(queue: readonly SyncItem[]): SyncItem[] {
  return queue.filter((item) => item.status === 'failed');
}

/** Selector: number of items still waiting to be delivered. */
export function pendingCount(queue: readonly SyncItem[]): number {
  return queue.reduce(
    (count, item) => (item.status === 'pending' ? count + 1 : count),
    0,
  );
}
