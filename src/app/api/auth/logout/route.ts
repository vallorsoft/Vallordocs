import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { hashRefreshToken } from '@/modules/auth';
import { buildAuditEntry } from '@/modules/audit';
import { parseUserAgent } from '@/modules/security';
import { authenticate, clientMeta, json, route } from '@/lib/http';
import { auditRepository, refreshTokenRepository } from '@/repositories';

/**
 * `POST /api/auth/logout` (PRD 2. fejezet – Kijelentkezés, Eszközkezelés).
 *
 * Revokes the caller's refresh token(s). With `allDevices` the whole session
 * fleet is dropped; otherwise only the presented refresh token is revoked. The
 * access token is stateless and simply expires. Requires a valid access token.
 */
export const dynamic = 'force-dynamic';

const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
  allDevices: z.boolean().optional(),
});

export const POST = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  const meta = clientMeta(request);
  const ua = parseUserAgent(meta.userAgent ?? '');

  const body = logoutSchema.parse(await request.json().catch(() => ({})));

  if (body.allDevices) {
    await refreshTokenRepository.revokeAllForUser(ctx.userId, new Date());
  } else if (body.refreshToken) {
    await refreshTokenRepository.revokeByHash(
      hashRefreshToken(body.refreshToken),
      new Date(),
    );
  }

  await auditRepository.record(
    buildAuditEntry({
      actor: {
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        ipAddress: meta.ipAddress,
        browser: ua.browser,
        os: ua.os,
        device: ua.device,
      },
      action: 'auth.logout',
    }),
  );

  return json({ ok: true });
});
