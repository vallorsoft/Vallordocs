import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { PERMISSIONS, hashPassword, requirePermission } from '@/modules/auth';
import { userProfileSchema } from '@/modules/users';
import type { Timezone } from '@prisma/client';
import { buildAuditEntry } from '@/modules/audit';
import { authenticate, clientMeta, json, route } from '@/lib/http';
import { auditRepository, userRepository } from '@/repositories';

/**
 * `GET /api/users` — list tenant users; `POST /api/users` — create a user.
 * Both require the `user.manage` permission (PRD 2. fejezet – Felhasználók).
 */
export const dynamic = 'force-dynamic';

const createUserSchema = userProfileSchema.extend({
  password: z.string().optional(),
});

/** Serialises a user row to a safe DTO (never exposes the password hash). */
function toDto(user: {
  id: string;
  name: string;
  email: string;
  status: string;
  userRoles: Array<{ role: { name: string } }>;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    roles: user.userRoles.map((ur) => ur.role.name),
  };
}

export const GET = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.USER_MANAGE);
  const users = await userRepository.listByTenant(ctx);
  return json({ users: users.map(toDto) });
});

export const POST = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.USER_MANAGE);

  const input = createUserSchema.parse(await request.json());
  const passwordHash = input.password
    ? await hashPassword(input.password)
    : undefined;

  const created = await userRepository.create(ctx, {
    name: input.name,
    email: input.email,
    phone: input.phone,
    language: input.language,
    // The users module validates the IANA form ('Europe/Budapest'); the Prisma
    // enum member is the underscore form ('Europe_Budapest').
    timezone: input.timezone.replace('/', '_') as Timezone,
    status: input.status,
    roles: input.roles,
    passwordHash,
  });

  const meta = clientMeta(request);
  await auditRepository.record(
    buildAuditEntry({
      actor: {
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        ipAddress: meta.ipAddress,
      },
      action: 'user.create',
      details: { entity: 'user', entityId: created.id },
    }),
  );

  return json({ user: toDto(created) }, 201);
});
