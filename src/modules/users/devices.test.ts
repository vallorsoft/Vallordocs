import { describe, expect, it } from 'vitest';
import {
  activeSessions,
  canRevokeSession,
  selectSessionsToRevoke,
  sortByLastUsed,
  type DeviceSession,
} from './devices';

function session(overrides: Partial<DeviceSession> = {}): DeviceSession {
  return {
    id: 'a',
    device: 'iPhone',
    browser: 'Safari',
    os: 'iOS',
    ipAddress: '1.2.3.4',
    lastUsedAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    current: false,
    revokedAt: null,
    ...overrides,
  };
}

describe('activeSessions', () => {
  it('filters out revoked sessions', () => {
    const sessions = [
      session({ id: 'a' }),
      session({ id: 'b', revokedAt: new Date() }),
    ];
    expect(activeSessions(sessions).map((s) => s.id)).toEqual(['a']);
  });
});

describe('sortByLastUsed', () => {
  it('orders most recently used first without mutating input', () => {
    const input = [
      session({ id: 'old', lastUsedAt: new Date('2026-01-01T00:00:00Z') }),
      session({ id: 'new', lastUsedAt: new Date('2026-03-01T00:00:00Z') }),
    ];
    expect(sortByLastUsed(input).map((s) => s.id)).toEqual(['new', 'old']);
    expect(input.map((s) => s.id)).toEqual(['old', 'new']);
  });
});

describe('selectSessionsToRevoke', () => {
  it('keeps the current session when keepCurrent is set', () => {
    const sessions = [
      session({ id: 'current', current: true }),
      session({ id: 'other' }),
    ];
    expect(selectSessionsToRevoke(sessions, { keepCurrent: true })).toEqual([
      'other',
    ]);
  });

  it('revokes every active session when keepCurrent is false', () => {
    const sessions = [
      session({ id: 'current', current: true }),
      session({ id: 'other' }),
    ];
    expect(
      selectSessionsToRevoke(sessions, { keepCurrent: false }).sort(),
    ).toEqual(['current', 'other']);
  });

  it('never returns already-revoked sessions', () => {
    const sessions = [
      session({ id: 'current', current: true }),
      session({ id: 'gone', revokedAt: new Date() }),
      session({ id: 'other' }),
    ];
    expect(selectSessionsToRevoke(sessions, { keepCurrent: true })).toEqual([
      'other',
    ]);
  });
});

describe('canRevokeSession', () => {
  it('refuses the current session', () => {
    expect(canRevokeSession(session({ current: true }))).toBe(false);
  });

  it('refuses an already-revoked session', () => {
    expect(canRevokeSession(session({ revokedAt: new Date() }))).toBe(false);
  });

  it('allows a normal other session', () => {
    expect(canRevokeSession(session())).toBe(true);
  });
});
