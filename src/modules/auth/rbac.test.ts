import { describe, expect, it } from 'vitest';
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  permissionsForRoles,
  can,
  canAll,
  canAny,
  requirePermission,
} from './rbac';
import { AppError } from '@/shared/errors';

describe('ROLE_PERMISSIONS', () => {
  it('grants the platform owner every permission', () => {
    const owner = ROLE_PERMISSIONS.platform_owner;
    for (const permission of Object.values(PERMISSIONS)) {
      expect(owner).toContain(permission);
    }
  });

  it('limits read_only to read-style permissions', () => {
    for (const permission of ROLE_PERMISSIONS.read_only) {
      expect(permission.endsWith('.read')).toBe(true);
    }
  });

  it('does not let a driver delete documents', () => {
    expect(ROLE_PERMISSIONS.driver).not.toContain(PERMISSIONS.DOCUMENT_DELETE);
  });
});

describe('permissionsForRoles', () => {
  it('merges and de-duplicates permissions across roles', () => {
    const merged = permissionsForRoles(['office_user', 'driver']);
    const unique = new Set(merged);
    expect(unique.size).toBe(merged.length);
    expect(merged).toContain(PERMISSIONS.DOCUMENT_WRITE); // from driver
    expect(merged).toContain(PERMISSIONS.DOCUMENT_READ); // shared
  });

  it('returns an empty list for no roles', () => {
    expect(permissionsForRoles([])).toEqual([]);
  });
});

describe('authorisation checks', () => {
  const principal = { permissions: permissionsForRoles(['dispatcher']) };

  it('can / canAll / canAny behave consistently', () => {
    expect(can(principal, PERMISSIONS.TRIP_WRITE)).toBe(true);
    expect(can(principal, PERMISSIONS.TENANT_MANAGE)).toBe(false);
    expect(
      canAll(principal, [PERMISSIONS.TRIP_READ, PERMISSIONS.TRIP_WRITE]),
    ).toBe(true);
    expect(
      canAll(principal, [PERMISSIONS.TRIP_READ, PERMISSIONS.TENANT_MANAGE]),
    ).toBe(false);
    expect(
      canAny(principal, [PERMISSIONS.TENANT_MANAGE, PERMISSIONS.TRIP_READ]),
    ).toBe(true);
  });

  it('requirePermission throws a forbidden AppError when missing', () => {
    try {
      requirePermission(principal, PERMISSIONS.TENANT_MANAGE);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('FORBIDDEN');
    }
  });

  it('requirePermission is a no-op when the permission is held', () => {
    expect(() =>
      requirePermission(principal, PERMISSIONS.TRIP_WRITE),
    ).not.toThrow();
  });
});
