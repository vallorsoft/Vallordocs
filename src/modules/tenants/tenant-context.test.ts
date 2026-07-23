import { describe, expect, it } from 'vitest';
import {
  requireTenantId,
  tenantScope,
  assertSameTenant,
  isPlatformContext,
  type TenantContext,
} from './tenant-context';
import { AppError } from '@/shared/errors';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

function ctx(tenantId: string | null): TenantContext {
  return {
    userId: 'user-1',
    tenantId,
    roles: tenantId ? ['tenant_admin'] : ['platform_owner'],
    permissions: [],
  };
}

describe('requireTenantId', () => {
  it('returns the tenant id when scoped', () => {
    expect(requireTenantId(ctx(TENANT_A))).toBe(TENANT_A);
  });

  it('throws for a platform (null tenant) context', () => {
    expect(() => requireTenantId(ctx(null))).toThrow(AppError);
  });
});

describe('tenantScope', () => {
  it('filters by tenant and excludes soft-deleted rows by default', () => {
    expect(tenantScope(ctx(TENANT_A))).toEqual({
      tenantId: TENANT_A,
      deletedAt: null,
    });
  });

  it('can include soft-deleted rows when requested', () => {
    expect(tenantScope(ctx(TENANT_A), { includeDeleted: true })).toEqual({
      tenantId: TENANT_A,
    });
  });
});

describe('assertSameTenant', () => {
  it('allows access to same-tenant resources', () => {
    expect(() =>
      assertSameTenant(ctx(TENANT_A), { tenantId: TENANT_A }),
    ).not.toThrow();
  });

  it('denies cross-tenant access (IDOR protection)', () => {
    try {
      assertSameTenant(ctx(TENANT_A), { tenantId: TENANT_B });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('FORBIDDEN');
    }
  });

  it('lets platform operators reach any tenant', () => {
    expect(() =>
      assertSameTenant(ctx(null), { tenantId: TENANT_B }),
    ).not.toThrow();
  });
});

describe('isPlatformContext', () => {
  it('distinguishes platform from tenant contexts', () => {
    expect(isPlatformContext(ctx(null))).toBe(true);
    expect(isPlatformContext(ctx(TENANT_A))).toBe(false);
  });
});
