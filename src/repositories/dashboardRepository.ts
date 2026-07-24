import { prisma } from '@/lib/prisma';
import type {
  DashboardDocRow,
  DashboardFileRow,
  DashboardJobRow,
} from '@/modules/dashboard';
import { tenantScope, type TenantContext } from '@/modules/tenants';
import { type Db } from './types';

/**
 * Dashboard read model repository (PRD 4./5. fejezet – Dashboard, Metrikák).
 *
 * The dashboard module aggregates over already-fetched rows (pure functions).
 * This repository owns the querying: it loads the minimal tenant-scoped
 * projections the aggregator needs, keeping the metric maths and the data access
 * cleanly separated.
 */
type DashboardDb = Db<'document' | 'aiJob' | 'storageFile'>;

/** The raw rows a dashboard summary is assembled from. */
export interface DashboardRows {
  docs: DashboardDocRow[];
  jobs: DashboardJobRow[];
  files: DashboardFileRow[];
}

export interface DashboardRepository {
  loadRows(ctx: TenantContext): Promise<DashboardRows>;
}

export function createDashboardRepository(
  db: DashboardDb,
): DashboardRepository {
  return {
    async loadRows(ctx) {
      const scoped = tenantScope(ctx);
      const [docs, jobs, files] = await Promise.all([
        db.document.findMany({
          where: scoped,
          select: { createdAt: true, driverId: true },
        }),
        db.aiJob.findMany({
          where: { tenantId: scoped.tenantId },
          select: { status: true, durationMs: true },
        }),
        db.storageFile.findMany({
          where: scoped,
          select: { sizeBytes: true },
        }),
      ]);
      return { docs, jobs, files };
    },
  };
}

/** Production instance bound to the shared Prisma singleton. */
export const dashboardRepository = createDashboardRepository(prisma);
