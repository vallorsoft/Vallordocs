// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { TenantContext } from '@/modules/tenants';
import { createUserRepository } from './userRepository';
import { createTripRepository } from './tripRepository';

/**
 * Tenant isolation is the primary, non-negotiable security requirement: every
 * tenant-scoped query must carry a `tenantId` filter. These tests assert that
 * the repositories cannot forget it, using a fake Prisma delegate that captures
 * the `where` clause each query is built with.
 */

const ctx: TenantContext = {
  userId: 'user-1',
  tenantId: 'tenant-A',
  roles: ['tenant_admin'],
  permissions: [],
};

describe('userRepository tenant isolation', () => {
  it('scopes list and lookup queries to the caller tenant', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const findFirst = vi.fn().mockResolvedValue(null);
    const repo = createUserRepository({
      user: { findMany, findFirst, create: vi.fn(), update: vi.fn() },
    } as never);

    await repo.listByTenant(ctx);
    expect(findMany.mock.calls[0]?.[0].where).toMatchObject({
      tenantId: 'tenant-A',
      deletedAt: null,
    });

    await repo.findById(ctx, 'user-9');
    expect(findFirst.mock.calls[0]?.[0].where).toMatchObject({
      tenantId: 'tenant-A',
      id: 'user-9',
    });
  });

  it('creates users bound to the caller tenant', async () => {
    const create = vi.fn().mockResolvedValue({});
    const repo = createUserRepository({
      user: { create, findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    } as never);

    await repo.create(ctx, {
      name: 'Nagy Béla',
      email: 'b@x.hu',
      roles: ['driver'],
    });
    expect(create.mock.calls[0]?.[0].data.tenantId).toBe('tenant-A');
  });

  it('does not tenant-scope the pre-auth email lookup but excludes soft-deleted', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const repo = createUserRepository({
      user: { findFirst, findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    } as never);

    await repo.findByEmailForAuth('Person@Example.com');
    const where = findFirst.mock.calls[0]?.[0].where;
    expect(where).toEqual({ email: 'person@example.com', deletedAt: null });
    expect(where).not.toHaveProperty('tenantId');
  });
});

describe('tripRepository tenant isolation', () => {
  it('scopes a status update so a foreign id updates zero rows', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const findFirst = vi.fn().mockResolvedValue(null);
    const repo = createTripRepository({
      trip: { updateMany, findFirst, findMany: vi.fn(), create: vi.fn() },
    } as never);

    await repo.updateStatus(ctx, 'trip-from-another-tenant', 'in_progress');
    expect(updateMany.mock.calls[0]?.[0].where).toMatchObject({
      tenantId: 'tenant-A',
      id: 'trip-from-another-tenant',
    });
  });
});
