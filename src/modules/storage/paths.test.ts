import { describe, expect, it } from 'vitest';
import {
  buildStorageKey,
  tenantPrefixOf,
  assertKeyBelongsToTenant,
} from './paths';
import { AppError } from '@/shared/errors';

const parts = {
  tenantId: 'tenant-1',
  tripId: 'trip-1',
  documentId: 'doc-1',
  variant: 'original' as const,
  extension: 'jpg',
};

describe('buildStorageKey', () => {
  it('produces the tenant-isolated structure with a uuid filename', () => {
    const key = buildStorageKey(parts);
    expect(key).toMatch(
      /^tenant-1\/documents\/trip-1\/doc-1\/original\/[0-9a-f-]{36}\.jpg$/,
    );
  });

  it('normalises the extension (strips dot, lower-cases)', () => {
    const key = buildStorageKey({
      ...parts,
      extension: '.PDF',
      variant: 'pdf',
    });
    expect(key.endsWith('.pdf')).toBe(true);
  });

  it('generates a unique key each call', () => {
    expect(buildStorageKey(parts)).not.toBe(buildStorageKey(parts));
  });

  it('rejects path-traversal attempts in segments', () => {
    expect(() => buildStorageKey({ ...parts, tripId: '..' })).toThrow(AppError);
    expect(() => buildStorageKey({ ...parts, documentId: 'a/b' })).toThrow(
      AppError,
    );
    expect(() => buildStorageKey({ ...parts, tenantId: '' })).toThrow(AppError);
  });
});

describe('tenant prefix helpers', () => {
  it('extracts the tenant prefix', () => {
    expect(tenantPrefixOf(buildStorageKey(parts))).toBe('tenant-1');
  });

  it('asserts a key belongs to a tenant', () => {
    const key = buildStorageKey(parts);
    expect(() => assertKeyBelongsToTenant(key, 'tenant-1')).not.toThrow();
    expect(() => assertKeyBelongsToTenant(key, 'tenant-2')).toThrow(AppError);
  });
});
