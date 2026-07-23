import { describe, expect, it } from 'vitest';
import {
  AI_STATUSES,
  markAllRead,
  markRead,
  notificationForAiStatus,
  sortNewestFirst,
  unreadCount,
  type NotificationRecord,
} from './notifications';

function rec(overrides: Partial<NotificationRecord>): NotificationRecord {
  return {
    id: 'n1',
    userId: 'u1',
    tenantId: 't1',
    type: 'info',
    title: 'T',
    message: 'M',
    readAt: null,
    createdAt: new Date('2026-07-23T10:00:00Z'),
    ...overrides,
  };
}

describe('notificationForAiStatus', () => {
  it('maps severities correctly', () => {
    expect(notificationForAiStatus('done').type).toBe('success');
    expect(notificationForAiStatus('failed').type).toBe('error');
    expect(notificationForAiStatus('retrying').type).toBe('warning');
    expect(notificationForAiStatus('cancelled').type).toBe('warning');
    expect(notificationForAiStatus('queued').type).toBe('info');
    expect(notificationForAiStatus('processing').type).toBe('info');
    expect(notificationForAiStatus('generating_pdf').type).toBe('info');
  });

  it('produces title/message i18n keys', () => {
    expect(notificationForAiStatus('done')).toEqual({
      type: 'success',
      titleKey: 'notifications.aiDone.title',
      messageKey: 'notifications.aiDone.message',
    });
    expect(notificationForAiStatus('generating_pdf').titleKey).toBe(
      'notifications.aiGeneratingPdf.title',
    );
  });

  it('covers every AI status', () => {
    for (const status of AI_STATUSES) {
      const d = notificationForAiStatus(status);
      expect(d.titleKey.startsWith('notifications.')).toBe(true);
      expect(d.titleKey.endsWith('.title')).toBe(true);
      expect(d.messageKey.endsWith('.message')).toBe(true);
    }
  });
});

describe('unreadCount', () => {
  it('counts only unread', () => {
    expect(unreadCount([])).toBe(0);
    expect(
      unreadCount([
        rec({ id: 'a', readAt: null }),
        rec({ id: 'b', readAt: new Date() }),
        rec({ id: 'c', readAt: null }),
      ]),
    ).toBe(2);
  });
});

describe('markRead', () => {
  it('marks selected unread as read and does not mutate input', () => {
    const now = new Date('2026-07-23T12:00:00Z');
    const input = [rec({ id: 'a' }), rec({ id: 'b' })];
    const out = markRead(input, ['a'], now);
    expect(out[0]!.readAt).toBe(now);
    expect(out[1]!.readAt).toBeNull();
    expect(input[0]!.readAt).toBeNull();
  });

  it('preserves existing readAt for already-read items', () => {
    const earlier = new Date('2026-07-01T00:00:00Z');
    const now = new Date('2026-07-23T12:00:00Z');
    const out = markRead([rec({ id: 'a', readAt: earlier })], ['a'], now);
    expect(out[0]!.readAt).toBe(earlier);
  });
});

describe('markAllRead', () => {
  it('marks every unread and leaves read ones', () => {
    const earlier = new Date('2026-07-01T00:00:00Z');
    const now = new Date('2026-07-23T12:00:00Z');
    const out = markAllRead(
      [rec({ id: 'a' }), rec({ id: 'b', readAt: earlier })],
      now,
    );
    expect(out[0]!.readAt).toBe(now);
    expect(out[1]!.readAt).toBe(earlier);
  });
});

describe('sortNewestFirst', () => {
  it('sorts by createdAt descending without mutating input', () => {
    const a = rec({ id: 'a', createdAt: new Date('2026-01-01') });
    const b = rec({ id: 'b', createdAt: new Date('2026-06-01') });
    const c = rec({ id: 'c', createdAt: new Date('2026-03-01') });
    const input = [a, b, c];
    const out = sortNewestFirst(input);
    expect(out.map((r) => r.id)).toEqual(['b', 'c', 'a']);
    expect(input.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
});
