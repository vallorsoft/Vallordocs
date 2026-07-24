import type { NextRequest } from 'next/server';
import { PERMISSIONS, requirePermission } from '@/modules/auth';
import {
  fromSettingRows,
  parseTenantSettings,
  toSettingRows,
} from '@/modules/settings';
import { buildAuditEntry } from '@/modules/audit';
import { authenticate, clientMeta, json, route } from '@/lib/http';
import { auditRepository, settingRepository } from '@/repositories';

/**
 * `GET /api/settings` — effective tenant settings (safe defaults merged);
 * `PUT /api/settings` — replace the tenant settings. Both require
 * `settings.manage`. PRD 2./5. fejezet – Tenant beállítások, Retention.
 */
export const dynamic = 'force-dynamic';

export const GET = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.SETTINGS_MANAGE);
  const rows = await settingRepository.listByTenant(ctx);
  return json({ settings: fromSettingRows(rows) });
});

export const PUT = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.SETTINGS_MANAGE);

  const settings = parseTenantSettings(await request.json());
  await settingRepository.upsertMany(ctx, toSettingRows(settings));

  const meta = clientMeta(request);
  await auditRepository.record(
    buildAuditEntry({
      actor: {
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        ipAddress: meta.ipAddress,
      },
      action: 'settings.update',
      details: { entity: 'settings', newValue: settings },
    }),
  );

  return json({ settings });
});
