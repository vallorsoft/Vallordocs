import type { NextRequest } from 'next/server';
import { verifyAccessToken, type Permission } from '@/modules/auth';
import { UnauthorizedError } from '@/shared/errors';
import type { TenantContext } from '@/modules/tenants';

/**
 * Request authentication context (PRD 2. fejezet – Munkamenet, 5. fejezet –
 * Hibakezelés).
 *
 * Turns an incoming HTTP request into the {@link TenantContext} that every
 * tenant-scoped operation carries. Authorisation is stateless: the access token
 * already embeds the tenant, roles and permissions, so building the context is
 * a pure verification step with no database round-trip. A missing or invalid
 * token yields a safe {@link UnauthorizedError} that maps to `401`.
 */

/** Extracts the bearer token from the `Authorization` header, if present. */
export function bearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

/**
 * Verifies the request's access token and returns the caller's tenant context.
 * Throws {@link UnauthorizedError} when the token is absent or invalid.
 */
export async function authenticate(
  request: NextRequest,
): Promise<TenantContext> {
  const token = bearerToken(request);
  if (!token) {
    throw new UnauthorizedError({ reason: 'missing bearer token' });
  }
  const claims = await verifyAccessToken(token);
  return {
    userId: claims.userId,
    tenantId: claims.tenantId,
    roles: claims.roles,
    // The token's permission strings are the RBAC catalogue's keys; the context
    // types them as the `Permission` union for downstream `requirePermission`.
    permissions: claims.permissions as Permission[],
  };
}

/** Non-sensitive request metadata used for audit and login history. */
export interface ClientMeta {
  ipAddress: string | undefined;
  userAgent: string | undefined;
}

/**
 * Best-effort client metadata. The IP is taken from the standard proxy headers
 * Fly.io sets; nothing here is trusted for authorisation, only for audit trails.
 */
export function clientMeta(request: NextRequest): ClientMeta {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress =
    forwarded?.split(',')[0]?.trim() ||
    request.headers.get('fly-client-ip') ||
    undefined;
  const userAgent = request.headers.get('user-agent') ?? undefined;
  return { ipAddress: ipAddress ?? undefined, userAgent };
}
