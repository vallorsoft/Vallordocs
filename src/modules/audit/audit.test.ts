import { describe, expect, it } from 'vitest';
import {
  AUDIT_ACTIONS,
  REDACTED_MASK,
  assertAuditImmutable,
  buildAuditEntry,
  diffValues,
  redactSensitive,
  type AuditActor,
} from './audit';

const actor: AuditActor = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  ipAddress: '10.0.0.1',
  browser: 'Chrome',
  os: 'Linux',
  device: 'desktop',
};

describe('buildAuditEntry', () => {
  it('defaults success to true and createdAt is injectable', () => {
    const now = new Date('2026-07-23T10:00:00Z');
    const entry = buildAuditEntry({
      actor,
      action: 'auth.login',
      createdAt: now,
    });
    expect(entry.success).toBe(true);
    expect(entry.createdAt).toBe(now);
    expect(entry.action).toBe('auth.login');
  });

  it('copies actor fields and defaults missing optionals to null', () => {
    const entry = buildAuditEntry({
      actor: { userId: null, tenantId: null },
      action: 'auth.login_failed',
      details: { success: false, errorText: 'bad password' },
    });
    expect(entry.userId).toBeNull();
    expect(entry.tenantId).toBeNull();
    expect(entry.ipAddress).toBeNull();
    expect(entry.browser).toBeNull();
    expect(entry.os).toBeNull();
    expect(entry.device).toBeNull();
    expect(entry.entity).toBeNull();
    expect(entry.entityId).toBeNull();
    expect(entry.oldValue).toBeNull();
    expect(entry.newValue).toBeNull();
    expect(entry.success).toBe(false);
    expect(entry.errorText).toBe('bad password');
  });

  it('freezes the returned entry', () => {
    const entry = buildAuditEntry({ actor, action: 'tenant.update' });
    expect(Object.isFrozen(entry)).toBe(true);
    expect(() => {
      (entry as { success: boolean }).success = false;
    }).toThrow();
  });

  it('redacts secrets inside oldValue/newValue', () => {
    const entry = buildAuditEntry({
      actor,
      action: 'user.create',
      details: {
        entity: 'User',
        entityId: 'user-2',
        newValue: { email: 'a@b.hu', passwordHash: 'super-secret' },
      },
    });
    expect(entry.newValue).toEqual({
      email: 'a@b.hu',
      passwordHash: REDACTED_MASK,
    });
  });

  it('every catalogue action is a valid literal', () => {
    for (const action of AUDIT_ACTIONS) {
      const entry = buildAuditEntry({ actor, action });
      expect(entry.action).toBe(action);
    }
  });
});

describe('redactSensitive', () => {
  it('masks default sensitive keys and leaves others untouched', () => {
    const result = redactSensitive({
      email: 'a@b.hu',
      password: 'p',
      token: 't',
      apiKey: 'k',
      secret: 's',
      tokenHash: 'th',
      keep: 1,
    });
    expect(result).toEqual({
      email: 'a@b.hu',
      password: REDACTED_MASK,
      token: REDACTED_MASK,
      apiKey: REDACTED_MASK,
      secret: REDACTED_MASK,
      tokenHash: REDACTED_MASK,
      keep: 1,
    });
  });

  it('accepts custom key list', () => {
    expect(redactSensitive({ pin: '1234', x: 1 }, ['pin'])).toEqual({
      pin: REDACTED_MASK,
      x: 1,
    });
  });

  it('returns null for null/undefined and does not mutate input', () => {
    expect(redactSensitive(null)).toBeNull();
    expect(redactSensitive(undefined)).toBeNull();
    const input = { password: 'p' };
    redactSensitive(input);
    expect(input.password).toBe('p');
  });
});

describe('diffValues', () => {
  it('returns only changed keys as old/new pairs (shallow)', () => {
    const delta = diffValues(
      { name: 'A', status: 'active', keep: 1 },
      { name: 'B', status: 'active', keep: 1 },
    );
    expect(delta).toEqual({ name: { old: 'A', new: 'B' } });
  });

  it('surfaces added and removed keys', () => {
    expect(diffValues({ a: 1 }, { b: 2 })).toEqual({
      a: { old: 1, new: undefined },
      b: { old: undefined, new: 2 },
    });
  });

  it('treats nested objects as changed by reference (shallow compare)', () => {
    const nested = { x: 1 };
    const same = diffValues({ meta: nested }, { meta: nested });
    expect(same).toEqual({});
    const changed = diffValues({ meta: { x: 1 } }, { meta: { x: 1 } });
    expect(changed).toHaveProperty('meta');
  });

  it('handles null/undefined inputs', () => {
    expect(diffValues(null, { a: 1 })).toEqual({
      a: { old: undefined, new: 1 },
    });
    expect(diffValues(undefined, undefined)).toEqual({});
  });
});

describe('assertAuditImmutable', () => {
  it('passes for a frozen entry', () => {
    const entry = buildAuditEntry({ actor, action: 'auth.logout' });
    expect(() => assertAuditImmutable(entry)).not.toThrow();
  });

  it('throws for a non-frozen entry', () => {
    const entry = buildAuditEntry({ actor, action: 'auth.logout' });
    const mutable = { ...entry };
    expect(() => assertAuditImmutable(mutable)).toThrow();
  });
});
