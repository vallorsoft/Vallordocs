import { z } from 'zod';
import type { NextRequest } from 'next/server';
import {
  hashRefreshToken,
  permissionsForRoles,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@/modules/auth';
import { buildAuditEntry } from '@/modules/audit';
import {
  InMemoryRateLimiterStore,
  RateLimiter,
  parseUserAgent,
} from '@/modules/security';
import { UnauthorizedError } from '@/shared/errors';
import { clientMeta, json, route } from '@/lib/http';
import {
  auditRepository,
  loginHistoryRepository,
  refreshTokenRepository,
  userRepository,
} from '@/repositories';
import { randomUUID } from 'node:crypto';

/**
 * `POST /api/auth/login` (PRD 2. fejezet – Bejelentkezés, 5. fejezet – Rate
 * Limit, Audit).
 *
 * Verifies credentials, issues an access + refresh token pair, persists the
 * refresh token as a hash (never in clear), and records both an audit entry and
 * a login-history row. Failed attempts are rate limited per client identifier to
 * blunt brute-force attacks and are never distinguished from "unknown user" in
 * the response, so the endpoint does not leak which emails exist.
 */
export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'validation.emailInvalid' }),
  password: z.string().min(1, { message: 'validation.passwordRequired' }),
});

// Brute-force protection is process-local here; a shared store (Redis) is the
// production swap-in behind the same interface.
const limiter = new RateLimiter(new InMemoryRateLimiterStore());

export const POST = route(async (request: NextRequest) => {
  const meta = clientMeta(request);
  const ua = parseUserAgent(meta.userAgent ?? '');
  const identifier = meta.ipAddress ?? 'unknown';
  limiter.assert({ action: 'login', identifier });

  const { email, password } = loginSchema.parse(await request.json());

  const user = await userRepository.findByEmailForAuth(email);
  const passwordOk =
    user?.passwordHash != null &&
    (await verifyPassword(user.passwordHash, password));

  if (!user || !passwordOk) {
    await loginHistoryRepository.record({
      tenantId: user?.tenantId ?? null,
      userId: user?.id ?? null,
      success: false,
      ipAddress: meta.ipAddress,
      browser: ua.browser,
      os: ua.os,
      device: ua.device,
    });
    await auditRepository.record(
      buildAuditEntry({
        actor: {
          userId: user?.id ?? null,
          tenantId: user?.tenantId ?? null,
          ipAddress: meta.ipAddress,
          browser: ua.browser,
          os: ua.os,
          device: ua.device,
        },
        action: 'auth.login_failed',
      }),
    );
    throw new UnauthorizedError({ reason: 'invalid credentials' });
  }

  const roles = user.userRoles.map((ur) => ur.role.name);
  const permissions = permissionsForRoles(roles);

  const accessToken = await signAccessToken({
    userId: user.id,
    tenantId: user.tenantId,
    roles,
    permissions,
  });

  const jti = randomUUID();
  const refreshToken = await signRefreshToken({
    userId: user.id,
    tenantId: user.tenantId,
    jti,
  });

  await refreshTokenRepository.create({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    device: ua.device,
    ipAddress: meta.ipAddress,
  });

  await userRepository.updateLastLogin(user.id, new Date());
  await loginHistoryRepository.record({
    tenantId: user.tenantId,
    userId: user.id,
    success: true,
    ipAddress: meta.ipAddress,
    browser: ua.browser,
    os: ua.os,
    device: ua.device,
  });
  await auditRepository.record(
    buildAuditEntry({
      actor: {
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress: meta.ipAddress,
        browser: ua.browser,
        os: ua.os,
        device: ua.device,
      },
      action: 'auth.login',
    }),
  );

  return json({
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      roles,
      permissions,
    },
  });
});
