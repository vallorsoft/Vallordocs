import type { NextRequest } from 'next/server';
import { PERMISSIONS, requirePermission } from '@/modules/auth';
import { authenticate, json, route } from '@/lib/http';
import { superadminRepository } from '@/repositories';

/**
 * `GET /api/superadmin/overview` — platform-wide console data (PRD 2. fejezet –
 * Platform szerepkörök).
 *
 * Guarded by `platform.manage`, the super-admin permission held only by
 * platform operators. This is a deliberate cross-tenant read, so the permission
 * check is the sole authorisation boundary and must run before any data access.
 */
export const dynamic = 'force-dynamic';

export const GET = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.PLATFORM_MANAGE);

  const overview = await superadminRepository.loadOverview();
  return json({ overview });
});
