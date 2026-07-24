import type { NextRequest } from 'next/server';
import { PERMISSIONS, requirePermission } from '@/modules/auth';
import { buildDashboard } from '@/modules/dashboard';
import { authenticate, json, route } from '@/lib/http';
import { dashboardRepository } from '@/repositories';

/**
 * `GET /api/dashboard` — tenant statistics summary (`document.read`).
 *
 * The repository loads minimal tenant-scoped projections; the pure dashboard
 * aggregator turns them into the summary. PRD 4. fejezet – Dashboard.
 */
export const dynamic = 'force-dynamic';

export const GET = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.DOCUMENT_READ);
  const rows = await dashboardRepository.loadRows(ctx);
  const summary = buildDashboard({ ...rows, now: new Date() });
  return json({ dashboard: summary });
});
