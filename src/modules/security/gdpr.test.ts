import { describe, expect, it } from 'vitest';
import {
  anonymizeUser,
  buildDataExport,
  expiredRecords,
  retentionCutoff,
} from './gdpr';

const user = {
  id: 'user-1',
  name: 'Kovács János',
  email: 'janos@example.com',
  phone: '+36301234567',
  avatarUrl: 'https://cdn.example.com/a.png',
  status: 'active',
  tenantId: 'tenant-1',
};

describe('anonymizeUser', () => {
  it('replaces every PII field with placeholders', () => {
    const result = anonymizeUser(user);
    expect(result.name).toBe('Anonymized User');
    expect(result.email).toBe('anonymized+user-1@example.invalid');
    expect(result.phone).toBeNull();
    expect(result.avatarUrl).toBeNull();
  });

  it('preserves non-PII and audit fields', () => {
    const result = anonymizeUser(user);
    expect(result.id).toBe('user-1');
    expect(result.status).toBe('active');
    expect(result.tenantId).toBe('tenant-1');
  });

  it('leaves no trace of the original PII', () => {
    const result = anonymizeUser(user);
    const serialised = JSON.stringify(result);
    expect(serialised).not.toContain('Kovács János');
    expect(serialised).not.toContain('janos@example.com');
    expect(serialised).not.toContain('+36301234567');
    expect(serialised).not.toContain('cdn.example.com');
  });

  it('is idempotent', () => {
    const once = anonymizeUser(user);
    const twice = anonymizeUser(once);
    expect(twice).toEqual(once);
  });
});

describe('buildDataExport', () => {
  it('assembles the export shape with an injected timestamp', () => {
    const now = new Date('2026-07-23T10:00:00.000Z');
    const result = buildDataExport(
      {
        user,
        documents: [{ id: 'doc-1' }],
        trips: [{ id: 'trip-1' }],
        auditLogs: [{ id: 'audit-1' }],
      },
      now,
    );

    expect(result.subject).toBe('user-1');
    expect(result.exportedAt).toBe('2026-07-23T10:00:00.000Z');
    expect(result.user).toBe(user);
    expect(result.documents).toEqual([{ id: 'doc-1' }]);
    expect(result.trips).toEqual([{ id: 'trip-1' }]);
    expect(result.auditLogs).toEqual([{ id: 'audit-1' }]);
  });

  it('produces a serialisable structure', () => {
    const result = buildDataExport({
      user,
      documents: [],
      trips: [],
      auditLogs: [],
    });
    expect(() => JSON.stringify(result)).not.toThrow();
  });
});

describe('retentionCutoff', () => {
  it('computes the cutoff by subtracting retentionDays', () => {
    const now = new Date('2026-07-23T00:00:00.000Z');
    const cutoff = retentionCutoff(now, 30);
    expect(cutoff.toISOString()).toBe('2026-06-23T00:00:00.000Z');
  });
});

describe('expiredRecords', () => {
  const now = new Date('2026-07-23T00:00:00.000Z');

  it('selects only records older than the cutoff', () => {
    const records = [
      { id: 'old', createdAt: new Date('2026-05-01T00:00:00.000Z') },
      { id: 'fresh', createdAt: new Date('2026-07-20T00:00:00.000Z') },
    ];
    const expired = expiredRecords(records, now, 30);
    expect(expired.map((r) => r.id)).toEqual(['old']);
  });

  it('treats a record exactly on the cutoff as not expired', () => {
    const cutoff = retentionCutoff(now, 30);
    const records = [{ id: 'boundary', createdAt: cutoff }];
    expect(expiredRecords(records, now, 30)).toEqual([]);
  });

  it('returns an empty array when nothing is expired', () => {
    const records = [
      { id: 'a', createdAt: new Date('2026-07-22T00:00:00.000Z') },
    ];
    expect(expiredRecords(records, now, 30)).toEqual([]);
  });
});
