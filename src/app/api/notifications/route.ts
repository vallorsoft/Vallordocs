import type { NextRequest } from 'next/server';
import { authenticate, json, route } from '@/lib/http';
import { notificationRepository } from '@/repositories';

/**
 * `GET /api/notifications` — the caller's notifications (newest first);
 * `PATCH /api/notifications` — mark all of the caller's notifications read.
 * Any authenticated user may manage their own notifications. PRD 4. fejezet.
 */
export const dynamic = 'force-dynamic';

export const GET = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  const notifications = await notificationRepository.listForUser(ctx);
  return json({ notifications });
});

export const PATCH = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  const updated = await notificationRepository.markAllRead(ctx, new Date());
  return json({ updated });
});
