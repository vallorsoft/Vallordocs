import type { Tenant } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { type Db } from './types';

/**
 * Tenant aggregate repository (PRD 2. fejezet – Multi-Tenant architektúra).
 *
 * A tenant row is itself the tenant boundary, so lookups are by primary key.
 * Soft-deleted tenants are excluded from reads.
 */
type TenantDb = Db<'tenant'>;

export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>;
}

export function createTenantRepository(db: TenantDb): TenantRepository {
  return {
    findById(id) {
      return db.tenant.findFirst({ where: { id, deletedAt: null } });
    },
  };
}

/** Production instance bound to the shared Prisma singleton. */
export const tenantRepository = createTenantRepository(prisma);
