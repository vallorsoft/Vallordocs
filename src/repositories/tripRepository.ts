import type { Trip, TripStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { TripInput } from '@/modules/trips';
import { tenantScope, type TenantContext } from '@/modules/tenants';
import { normalizePagination, type Db, type Pagination } from './types';

/**
 * Trip aggregate repository (PRD 7. fejezet – Trips).
 *
 * Every query is tenant-scoped. The status state machine itself lives in the
 * trips module; this repository only persists the already-validated target
 * status, and even the write is tenant-scoped (defence in depth against IDOR).
 */
type TripDb = Db<'trip'>;

export interface TripRepository {
  listByTenant(ctx: TenantContext, page?: Pagination): Promise<Trip[]>;
  findById(ctx: TenantContext, id: string): Promise<Trip | null>;
  create(ctx: TenantContext, input: TripInput): Promise<Trip>;
  updateStatus(
    ctx: TenantContext,
    id: string,
    status: TripStatus,
  ): Promise<Trip | null>;
}

export function createTripRepository(db: TripDb): TripRepository {
  return {
    listByTenant(ctx, page) {
      const { skip, take } = normalizePagination(page);
      return db.trip.findMany({
        where: tenantScope(ctx),
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
    },

    findById(ctx, id) {
      return db.trip.findFirst({ where: { ...tenantScope(ctx), id } });
    },

    create(ctx, input) {
      const tenant = tenantScope(ctx);
      return db.trip.create({
        data: {
          tenantId: tenant.tenantId,
          tripNumber: input.tripNumber,
          orderNumber: input.orderNumber ?? null,
          originPlace: input.originPlace ?? null,
          destination: input.destination ?? null,
          departureAt: input.departureAt ?? null,
          arrivalAt: input.arrivalAt ?? null,
          status: input.status,
          createdBy: ctx.userId,
        },
      });
    },

    async updateStatus(ctx, id, status) {
      // Scoped update: the tenant filter is part of the write predicate, so a
      // mismatched tenant simply updates zero rows.
      await db.trip.updateMany({
        where: { ...tenantScope(ctx), id },
        data: { status, updatedBy: ctx.userId },
      });
      return db.trip.findFirst({ where: { ...tenantScope(ctx), id } });
    },
  };
}

/** Production instance bound to the shared Prisma singleton. */
export const tripRepository = createTripRepository(prisma);
