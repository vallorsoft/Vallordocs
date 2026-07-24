import type { AuditLog, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { AuditEntry } from '@/modules/audit';
import { tenantScope, type TenantContext } from '@/modules/tenants';
import { normalizePagination, type Db, type Pagination } from './types';

/**
 * Audit log repository (PRD 5. fejezet – Audit).
 *
 * The audit log is append-only: this repository exposes `record` and reads, but
 * deliberately no update or delete. Entries are built by the audit module and
 * merely persisted here. Reads are tenant-scoped.
 */
type AuditDb = Db<'auditLog'>;

export interface AuditRepository {
  record(entry: AuditEntry): Promise<AuditLog>;
  listByTenant(ctx: TenantContext, page?: Pagination): Promise<AuditLog[]>;
}

export function createAuditRepository(db: AuditDb): AuditRepository {
  return {
    record(entry) {
      const data: Prisma.AuditLogUncheckedCreateInput = {
        tenantId: entry.tenantId,
        userId: entry.userId,
        ipAddress: entry.ipAddress,
        browser: entry.browser,
        os: entry.os,
        device: entry.device,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        oldValue: (entry.oldValue ?? undefined) as Prisma.InputJsonValue,
        newValue: (entry.newValue ?? undefined) as Prisma.InputJsonValue,
        success: entry.success,
        errorText: entry.errorText,
      };
      return db.auditLog.create({ data });
    },

    listByTenant(ctx, page) {
      const { skip, take } = normalizePagination(page);
      // auditLog has no soft-delete column, so scope by tenant only.
      return db.auditLog.findMany({
        where: tenantScope(ctx, { includeDeleted: true }),
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
    },
  };
}

/** Production instance bound to the shared Prisma singleton. */
export const auditRepository = createAuditRepository(prisma);
