import { prisma } from '@/lib/prisma';
import { type Db } from './types';

/**
 * Platform (super-admin) read model repository (PRD 2. fejezet – Multi-Tenant,
 * Platform szerepkörök).
 *
 * This is the one repository that deliberately operates **across** tenant
 * boundaries: it powers the platform console that only a super-admin
 * (`platform.manage`) may reach. Because it bypasses {@link tenantScope}, every
 * caller MUST be authorised with the platform permission at the route layer —
 * the isolation guarantee for normal, tenant-scoped repositories does not apply
 * here by design.
 */
type SuperadminDb = Db<'tenant' | 'user' | 'document' | 'driver' | 'trip'>;

/** A single tenant row with its live, cross-tenant usage counters. */
export interface PlatformTenantRow {
  id: string;
  companyName: string;
  country: string | null;
  isActive: boolean;
  createdAt: Date;
  userCount: number;
  documentCount: number;
  driverCount: number;
}

/** The platform-wide overview a super-admin sees. */
export interface PlatformOverview {
  totals: {
    tenants: number;
    activeTenants: number;
    users: number;
    documents: number;
    drivers: number;
    trips: number;
  };
  tenants: PlatformTenantRow[];
}

export interface SuperadminRepository {
  loadOverview(): Promise<PlatformOverview>;
}

export function createSuperadminRepository(
  db: SuperadminDb,
): SuperadminRepository {
  return {
    async loadOverview() {
      const notDeleted = { deletedAt: null };

      const [
        tenants,
        totalTenants,
        activeTenants,
        totalUsers,
        totalDocuments,
        totalDrivers,
        totalTrips,
      ] = await Promise.all([
        db.tenant.findMany({
          where: notDeleted,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            companyName: true,
            country: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: { users: true, documents: true, drivers: true },
            },
          },
        }),
        db.tenant.count({ where: notDeleted }),
        db.tenant.count({ where: { ...notDeleted, isActive: true } }),
        db.user.count({ where: notDeleted }),
        db.document.count({ where: notDeleted }),
        db.driver.count({ where: notDeleted }),
        db.trip.count({ where: notDeleted }),
      ]);

      return {
        totals: {
          tenants: totalTenants,
          activeTenants,
          users: totalUsers,
          documents: totalDocuments,
          drivers: totalDrivers,
          trips: totalTrips,
        },
        tenants: tenants.map((tenant) => ({
          id: tenant.id,
          companyName: tenant.companyName,
          country: tenant.country,
          isActive: tenant.isActive,
          createdAt: tenant.createdAt,
          userCount: tenant._count.users,
          documentCount: tenant._count.documents,
          driverCount: tenant._count.drivers,
        })),
      };
    },
  };
}

/** Production instance bound to the shared Prisma singleton. */
export const superadminRepository = createSuperadminRepository(prisma);
