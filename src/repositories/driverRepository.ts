import type { Driver } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { DriverInput } from '@/modules/drivers';
import { tenantScope, type TenantContext } from '@/modules/tenants';
import { normalizePagination, type Db, type Pagination } from './types';

/**
 * Driver aggregate repository (PRD 2./7. fejezet – Drivers).
 *
 * Every query is tenant-scoped through {@link tenantScope}; a driver is never
 * readable or writable across a tenant boundary.
 */
type DriverDb = Db<'driver'>;

export interface DriverRepository {
  listByTenant(ctx: TenantContext, page?: Pagination): Promise<Driver[]>;
  findById(ctx: TenantContext, id: string): Promise<Driver | null>;
  create(ctx: TenantContext, input: DriverInput): Promise<Driver>;
}

export function createDriverRepository(db: DriverDb): DriverRepository {
  return {
    listByTenant(ctx, page) {
      const { skip, take } = normalizePagination(page);
      return db.driver.findMany({
        where: tenantScope(ctx),
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
    },

    findById(ctx, id) {
      return db.driver.findFirst({ where: { ...tenantScope(ctx), id } });
    },

    create(ctx, input) {
      const tenant = tenantScope(ctx);
      return db.driver.create({
        data: {
          tenantId: tenant.tenantId,
          name: input.name,
          driverCode: input.driverCode,
          phone: input.phone ?? null,
          email: input.email ?? null,
          licenseNumber: input.licenseNumber ?? null,
          adrCertified: input.adrCertified,
          status: input.status,
          createdBy: ctx.userId,
        },
      });
    },
  };
}

/** Production instance bound to the shared Prisma singleton. */
export const driverRepository = createDriverRepository(prisma);
