/**
 * Public API of the notifications module (PRD 3. fejezet – Értesítések
 * állapotai; 4. fejezet – Driver értesítések).
 */
export {
  NOTIFICATION_TYPES,
  AI_STATUSES,
  notificationForAiStatus,
  unreadCount,
  markRead,
  markAllRead,
  sortNewestFirst,
  type NotificationType,
  type AiStatus,
  type NotificationDescriptor,
  type NotificationRecord,
} from './notifications';
