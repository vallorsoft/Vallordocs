import type { NextRequest } from 'next/server';
import { NotFoundError } from '@/shared/errors';
import { authenticate, json, route } from '@/lib/http';
import { userRepository } from '@/repositories';

/**
 * `GET /api/me` (PRD 2. fejezet – Saját profil).
 *
 * Returns the authenticated caller's profile and effective authorisation
 * context (tenant, roles, permissions) derived from the access token.
 */
export const dynamic = 'force-dynamic';

export const GET = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  const user = await userRepository.findByIdForAuth(ctx.userId);
  if (!user) throw new NotFoundError();

  return json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    language: user.language,
    timezone: user.timezone,
    status: user.status,
    tenantId: ctx.tenantId,
    roles: ctx.roles,
    permissions: ctx.permissions,
  });
});
