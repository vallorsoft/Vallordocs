/**
 * Public API of the offline module (PRD 4. fejezet – Offline működés,
 * Background Sync, PWA; 3. fejezet – Újrapróbálható feldolgozás).
 */
export {
  enqueue,
  dueItems,
  markInFlight,
  markDone,
  markFailed,
  deadLettered,
  pendingCount,
  DEFAULT_BASE_DELAY_MS,
  DEFAULT_MAX_DELAY_MS,
  DEFAULT_MAX_ATTEMPTS,
  type SyncItem,
  type SyncItemKind,
  type SyncItemStatus,
  type BackoffOptions,
} from './sync-queue';
