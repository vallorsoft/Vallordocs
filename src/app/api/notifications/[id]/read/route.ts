import type { NextRequest } from 'next/server';
import { NotFoundError } from '@/shared/errors';
import { authenticate, json, route } from '@/lib/http';
import { notificationRepository } from '@/repositories';

/**
 * `PATCH /api/notifications/:id/read` — mark a single notification read.
 *
 * The update is tenant/user-scoped in the repository, so an id belonging to
 * another tenant simply matches zero rows and returns 404. PRD 4. fejezet.
 */
export const dynamic = 'force-dynamic';

export const PATCH = route(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
  ) => {
    const ctx = await authenticate(request);
    const { id } = await context.params;
    const updated = await notificationRepository.markRead(ctx, id, new Date());
    if (updated === 0) throw new NotFoundError();
    return json({ ok: true });
  },
);
