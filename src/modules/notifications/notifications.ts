/**
 * Notification mapping and read-state logic (PRD 3. fejezet – Értesítések
 * állapotai; 4. fejezet – Driver értesítések; NotificationType enum).
 *
 * Pure functions only: no Prisma, no React, no I/O. The document/AI lifecycle is
 * mapped to a notification descriptor carrying i18n keys (never raw strings), and
 * read-state transitions return new arrays so callers can persist the result.
 */

/** Notification severities, mirroring the NotificationType enum. */
export const NOTIFICATION_TYPES = [
  'info',
  'success',
  'warning',
  'error',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * AI/document lifecycle statuses, mirroring the AiJobStatus enum
 * (PRD 3. fejezet – Értesítések állapotai).
 */
export const AI_STATUSES = [
  'queued',
  'processing',
  'generating_pdf',
  'done',
  'failed',
  'retrying',
  'cancelled',
] as const;

export type AiStatus = (typeof AI_STATUSES)[number];

/** A notification descriptor with translation keys resolved by the UI. */
export interface NotificationDescriptor {
  type: NotificationType;
  titleKey: string;
  messageKey: string;
}

/** i18n key stem per AI status; `.title`/`.message` are appended by the UI. */
const AI_STATUS_KEY: Record<AiStatus, string> = {
  queued: 'notifications.aiQueued',
  processing: 'notifications.aiProcessing',
  generating_pdf: 'notifications.aiGeneratingPdf',
  done: 'notifications.aiDone',
  failed: 'notifications.aiFailed',
  retrying: 'notifications.aiRetrying',
  cancelled: 'notifications.aiCancelled',
};

/** Severity per AI status. */
const AI_STATUS_TYPE: Record<AiStatus, NotificationType> = {
  queued: 'info',
  processing: 'info',
  generating_pdf: 'info',
  done: 'success',
  failed: 'error',
  retrying: 'warning',
  cancelled: 'warning',
};

/**
 * Maps an AI/document lifecycle status to a notification descriptor with i18n
 * keys. `done` → success, `failed` → error, `retrying`/`cancelled` → warning,
 * everything else → info.
 */
export function notificationForAiStatus(
  status: AiStatus,
): NotificationDescriptor {
  const stem = AI_STATUS_KEY[status];
  return {
    type: AI_STATUS_TYPE[status],
    titleKey: `${stem}.title`,
    messageKey: `${stem}.message`,
  };
}

/** A persisted notification, mirroring the Notification model. */
export interface NotificationRecord {
  id: string;
  userId: string;
  tenantId: string;
  type: NotificationType;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
}

/** Number of unread notifications (those without a `readAt`). */
export function unreadCount(records: NotificationRecord[]): number {
  return records.reduce(
    (count, r) => (r.readAt === null ? count + 1 : count),
    0,
  );
}

/**
 * Marks the notifications whose id is in `ids` as read at `now`. Pure: returns a
 * new array; already-read notifications keep their original `readAt`.
 */
export function markRead(
  records: NotificationRecord[],
  ids: string[],
  now: Date,
): NotificationRecord[] {
  const target = new Set(ids);
  return records.map((r) =>
    target.has(r.id) && r.readAt === null ? { ...r, readAt: now } : r,
  );
}

/** Marks every unread notification as read at `now`. Pure: returns a new array. */
export function markAllRead(
  records: NotificationRecord[],
  now: Date,
): NotificationRecord[] {
  return records.map((r) => (r.readAt === null ? { ...r, readAt: now } : r));
}

/**
 * Returns a new array sorted newest-first by `createdAt`. Stable ordering: the
 * input is not mutated.
 */
export function sortNewestFirst(
  records: NotificationRecord[],
): NotificationRecord[] {
  return [...records].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}
