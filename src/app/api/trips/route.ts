import type { NextRequest } from 'next/server';
import { PERMISSIONS, requirePermission } from '@/modules/auth';
import { parseTrip } from '@/modules/trips';
import { authenticate, json, route } from '@/lib/http';
import { tripRepository } from '@/repositories';

/**
 * `GET /api/trips` — list tenant trips (`trip.read`);
 * `POST /api/trips` — create a trip (`trip.write`).
 * PRD 4. fejezet – Fuvarok.
 */
export const dynamic = 'force-dynamic';

export const GET = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.TRIP_READ);
  const trips = await tripRepository.listByTenant(ctx);
  return json({ trips });
});

export const POST = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.TRIP_WRITE);
  const input = parseTrip(await request.json());
  const trip = await tripRepository.create(ctx, input);
  return json({ trip }, 201);
});
