// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createSuperadminRepository } from './superadminRepository';

/**
 * The super-admin repository is the one deliberate cross-tenant reader. These
 * tests assert that it queries every tenant (never scoped to one) yet still
 * excludes soft-deleted rows, and that it projects the per-tenant counters into
 * the platform overview shape the console consumes.
 */

function fakeDb(overrides: {
  tenants?: unknown[];
  counts?: Record<string, number>;
}) {
  const tenants = overrides.tenants ?? [];
  const counts = overrides.counts ?? {};
  const tenantCount = vi.fn(({ where }: { where: { isActive?: boolean } }) =>
    Promise.resolve(
      where.isActive ? (counts.activeTenants ?? 0) : (counts.tenants ?? 0),
    ),
  );
  const findMany = vi.fn().mockResolvedValue(tenants);
  return {
    db: {
      tenant: { findMany, count: tenantCount },
      user: { count: vi.fn().mockResolvedValue(counts.users ?? 0) },
      document: { count: vi.fn().mockResolvedValue(counts.documents ?? 0) },
      driver: { count: vi.fn().mockResolvedValue(counts.drivers ?? 0) },
      trip: { count: vi.fn().mockResolvedValue(counts.trips ?? 0) },
    },
    findMany,
    tenantCount,
  };
}

describe('superadminRepository', () => {
  it('reads across all tenants but excludes soft-deleted rows', async () => {
    const { db, findMany } = fakeDb({});
    const repo = createSuperadminRepository(db as never);

    await repo.loadOverview();

    const where = findMany.mock.calls[0]?.[0].where;
    expect(where).toEqual({ deletedAt: null });
    expect(where).not.toHaveProperty('tenantId');
  });

  it('projects tenant rows with their usage counters and totals', async () => {
    const createdAt = new Date('2026-01-02T03:04:05.000Z');
    const { db } = fakeDb({
      tenants: [
        {
          id: 't-1',
          companyName: 'Vallor',
          country: 'HU',
          isActive: true,
          createdAt,
          _count: { users: 3, documents: 12, drivers: 4 },
        },
      ],
      counts: {
        tenants: 1,
        activeTenants: 1,
        users: 3,
        documents: 12,
        drivers: 4,
        trips: 7,
      },
    });
    const repo = createSuperadminRepository(db as never);

    const overview = await repo.loadOverview();

    expect(overview.totals).toEqual({
      tenants: 1,
      activeTenants: 1,
      users: 3,
      documents: 12,
      drivers: 4,
      trips: 7,
    });
    expect(overview.tenants).toEqual([
      {
        id: 't-1',
        companyName: 'Vallor',
        country: 'HU',
        isActive: true,
        createdAt,
        userCount: 3,
        documentCount: 12,
        driverCount: 4,
      },
    ]);
  });
});
