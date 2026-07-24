import type { NextRequest } from 'next/server';
import { PERMISSIONS, requirePermission } from '@/modules/auth';
import { authenticate, json, route } from '@/lib/http';
import { auditRepository } from '@/repositories';

/**
 * `GET /api/audit` — the tenant's audit trail (`audit.read`).
 *
 * The audit log is append-only and tenant-scoped; there is deliberately no write
 * endpoint here — entries are recorded as a side effect of the actions they
 * describe. PRD 5. fejezet – Audit.
 */
export const dynamic = 'force-dynamic';

export const GET = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.AUDIT_READ);
  const entries = await auditRepository.listByTenant(ctx);
  return json({ entries });
});
