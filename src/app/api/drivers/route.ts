import type { NextRequest } from 'next/server';
import { PERMISSIONS, requirePermission } from '@/modules/auth';
import { parseDriver } from '@/modules/drivers';
import { authenticate, json, route } from '@/lib/http';
import { driverRepository } from '@/repositories';

/**
 * `GET /api/drivers` — list tenant drivers (`driver.read`);
 * `POST /api/drivers` — create a driver (`driver.write`).
 * PRD 2. fejezet – Sofőrök.
 */
export const dynamic = 'force-dynamic';

export const GET = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.DRIVER_READ);
  const drivers = await driverRepository.listByTenant(ctx);
  return json({ drivers });
});

export const POST = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.DRIVER_WRITE);
  const input = parseDriver(await request.json());
  const driver = await driverRepository.create(ctx, input);
  return json({ driver }, 201);
});
