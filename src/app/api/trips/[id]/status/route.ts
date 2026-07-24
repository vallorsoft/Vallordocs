import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { PERMISSIONS, requirePermission } from '@/modules/auth';
import { assertTransition, tripStatusSchema } from '@/modules/trips';
import { NotFoundError } from '@/shared/errors';
import { authenticate, json, route } from '@/lib/http';
import { tripRepository } from '@/repositories';

/**
 * `PATCH /api/trips/:id/status` — advance a trip's status (`trip.write`).
 *
 * The transition is validated against the trip status state machine
 * ({@link assertTransition}); an illegal jump is rejected before any write, and
 * the update itself is tenant-scoped so a foreign trip id can never be touched.
 * PRD 4. fejezet – Fuvar státusz állapotgép.
 */
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ status: tripStatusSchema });

export const PATCH = route(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const ctx = await authenticate(request);
    requirePermission(ctx, PERMISSIONS.TRIP_WRITE);
    const { id } = await context.params;

    const current = await tripRepository.findById(ctx, id);
    if (!current) throw new NotFoundError();

    const { status } = bodySchema.parse(await request.json());
    assertTransition(current.status, status);

    const trip = await tripRepository.updateStatus(ctx, id, status);
    if (!trip) throw new NotFoundError();
    return json({ trip });
  },
);
