import type { Prisma, Setting } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { SettingRow } from '@/modules/settings';
import { tenantScope, type TenantContext } from '@/modules/tenants';
import { type Db } from './types';

/**
 * Settings repository (PRD 2./5./7. fejezet – Settings).
 *
 * Tenant settings are persisted as key/value rows. This repository reads all
 * rows for the caller's tenant and upserts a validated set produced by the
 * settings module. Every operation is tenant-scoped.
 */
type SettingDb = Db<'setting'>;

export interface SettingRepository {
  listByTenant(ctx: TenantContext): Promise<Setting[]>;
  upsertMany(ctx: TenantContext, rows: SettingRow[]): Promise<void>;
}

export function createSettingRepository(db: SettingDb): SettingRepository {
  return {
    listByTenant(ctx) {
      // Setting has no soft-delete column, so scope by tenant only.
      return db.setting.findMany({
        where: tenantScope(ctx, { includeDeleted: true }),
        orderBy: { key: 'asc' },
      });
    },

    async upsertMany(ctx, rows) {
      const tenantId = tenantScope(ctx).tenantId;
      for (const row of rows) {
        const value = row.value as Prisma.InputJsonValue;
        await db.setting.upsert({
          where: { tenantId_key: { tenantId, key: row.key } },
          create: { tenantId, key: row.key, value, updatedBy: ctx.userId },
          update: { value, updatedBy: ctx.userId },
        });
      }
    },
  };
}

/** Production instance bound to the shared Prisma singleton. */
export const settingRepository = createSettingRepository(prisma);
