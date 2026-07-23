import { createHash } from 'node:crypto';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { getEnv } from '@/config';
import { UnauthorizedError } from '@/shared/errors';
import type { RoleName } from '@prisma/client';

/**
 * JWT session tokens (PRD 2./5. fejezet – Munkamenet).
 *
 * The system issues a short-lived access token and a long-lived refresh token.
 * Access tokens are stateless and carry the tenant, roles and permissions so
 * that authorisation checks never need a database round-trip. Refresh tokens
 * are opaque to the client and are additionally persisted (hashed) so they can
 * be revoked per device.
 */

const ISSUER = 'vallordocs';
const ACCESS_AUDIENCE = 'vallordocs:access';
const REFRESH_AUDIENCE = 'vallordocs:refresh';

/** Access tokens are intentionally short-lived. */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
/** Refresh tokens live longer and are rotated on use. */
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface AccessTokenClaims {
  /** User id (JWT `sub`). */
  userId: string;
  /** Tenant the session is scoped to; platform-level users may have none. */
  tenantId: string | null;
  roles: RoleName[];
  permissions: string[];
}

export interface RefreshTokenClaims {
  userId: string;
  tenantId: string | null;
  /** Unique token id, also used to correlate the persisted, hashed record. */
  jti: string;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(getEnv().JWT_SECRET);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

/** Signs a stateless access token embedding the authorisation context. */
export async function signAccessToken(
  claims: AccessTokenClaims,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<string> {
  return new SignJWT({
    tenantId: claims.tenantId,
    roles: claims.roles,
    permissions: claims.permissions,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.userId)
    .setIssuer(ISSUER)
    .setAudience(ACCESS_AUDIENCE)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + ACCESS_TOKEN_TTL_SECONDS)
    .sign(secretKey());
}

/** Verifies an access token, throwing {@link UnauthorizedError} when invalid. */
export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenClaims> {
  const payload = await verifyToken(token, ACCESS_AUDIENCE);
  if (typeof payload.sub !== 'string') {
    throw new UnauthorizedError({ reason: 'missing subject' });
  }
  return {
    userId: payload.sub,
    tenantId: typeof payload.tenantId === 'string' ? payload.tenantId : null,
    roles: toStringArray(payload.roles) as RoleName[],
    permissions: toStringArray(payload.permissions),
  };
}

/** Signs a refresh token. Its `jti` correlates the persisted hashed record. */
export async function signRefreshToken(
  claims: RefreshTokenClaims,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<string> {
  return new SignJWT({ tenantId: claims.tenantId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.userId)
    .setIssuer(ISSUER)
    .setAudience(REFRESH_AUDIENCE)
    .setJti(claims.jti)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + REFRESH_TOKEN_TTL_SECONDS)
    .sign(secretKey());
}

/** Verifies a refresh token, throwing {@link UnauthorizedError} when invalid. */
export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenClaims> {
  const payload = await verifyToken(token, REFRESH_AUDIENCE);
  if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string') {
    throw new UnauthorizedError({ reason: 'malformed refresh token' });
  }
  return {
    userId: payload.sub,
    tenantId: typeof payload.tenantId === 'string' ? payload.tenantId : null,
    jti: payload.jti,
  };
}

async function verifyToken(
  token: string,
  audience: string,
): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience,
    });
    return payload;
  } catch {
    // Never surface the underlying jose error to callers.
    throw new UnauthorizedError({ reason: 'invalid token' });
  }
}

/**
 * Derives the storage representation of a refresh token. Only this hash is
 * persisted, so a database leak never exposes usable tokens.
 */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
