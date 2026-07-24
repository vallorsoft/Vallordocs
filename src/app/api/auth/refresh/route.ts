import { z } from 'zod';
import type { NextRequest } from 'next/server';
import {
  hashRefreshToken,
  permissionsForRoles,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@/modules/auth';
import { UnauthorizedError } from '@/shared/errors';
import { clientMeta, json, route } from '@/lib/http';
import { refreshTokenRepository, userRepository } from '@/repositories';
import { randomUUID } from 'node:crypto';

/**
 * `POST /api/auth/refresh` (PRD 2. fejezet – Munkamenet, token rotáció).
 *
 * Exchanges a valid, unrevoked refresh token for a fresh access + refresh pair.
 * Refresh tokens are single-use: the presented token is revoked and a new one is
 * issued (rotation), so a leaked token stops working the moment it is replayed.
 */
export const dynamic = 'force-dynamic';

const refreshSchema = z.object({
  refreshToken: z.string().min(1, { message: 'validation.tokenRequired' }),
});

export const POST = route(async (request: NextRequest) => {
  const meta = clientMeta(request);
  const { refreshToken } = refreshSchema.parse(await request.json());

  const claims = await verifyRefreshToken(refreshToken);
  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await refreshTokenRepository.findActiveByHash(
    tokenHash,
    new Date(),
  );
  if (!stored || stored.userId !== claims.userId) {
    throw new UnauthorizedError({ reason: 'refresh token not active' });
  }

  const user = await userRepository.findByIdForAuth(claims.userId);
  if (!user) {
    throw new UnauthorizedError({ reason: 'user no longer exists' });
  }

  // Rotate: the presented token can never be used again.
  await refreshTokenRepository.revokeByHash(tokenHash, new Date());

  const roles = user.userRoles.map((ur) => ur.role.name);
  const permissions = permissionsForRoles(roles);

  const accessToken = await signAccessToken({
    userId: user.id,
    tenantId: user.tenantId,
    roles,
    permissions,
  });
  const jti = randomUUID();
  const nextRefresh = await signRefreshToken({
    userId: user.id,
    tenantId: user.tenantId,
    jti,
  });
  await refreshTokenRepository.create({
    userId: user.id,
    tokenHash: hashRefreshToken(nextRefresh),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    ipAddress: meta.ipAddress,
  });

  return json({
    accessToken,
    refreshToken: nextRefresh,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
});
