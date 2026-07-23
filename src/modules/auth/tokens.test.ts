// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resetEnvCache } from '@/config';
import { AppError } from '@/shared/errors';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
} from './tokens';

const REQUIRED_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/vallordocs',
  JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
  FLY_STORAGE_PATH: '/tmp/storage',
} as const;

beforeAll(() => {
  for (const [key, value] of Object.entries(REQUIRED_ENV)) {
    process.env[key] = value;
  }
  resetEnvCache();
});

afterAll(() => {
  resetEnvCache();
});

const claims = {
  userId: '11111111-1111-1111-1111-111111111111',
  tenantId: '22222222-2222-2222-2222-222222222222',
  roles: ['tenant_admin'] as const,
  permissions: ['document.read', 'document.write'],
};

describe('access tokens', () => {
  it('round-trips the authorisation context', async () => {
    const token = await signAccessToken({ ...claims, roles: ['tenant_admin'] });
    const decoded = await verifyAccessToken(token);
    expect(decoded.userId).toBe(claims.userId);
    expect(decoded.tenantId).toBe(claims.tenantId);
    expect(decoded.roles).toEqual(['tenant_admin']);
    expect(decoded.permissions).toEqual(claims.permissions);
  });

  it('supports platform users with a null tenant', async () => {
    const token = await signAccessToken({
      userId: claims.userId,
      tenantId: null,
      roles: ['platform_owner'],
      permissions: [],
    });
    const decoded = await verifyAccessToken(token);
    expect(decoded.tenantId).toBeNull();
  });

  it('rejects a tampered token', async () => {
    const token = await signAccessToken({ ...claims, roles: ['tenant_admin'] });
    const tampered = `${token}tamper`;
    await expect(verifyAccessToken(tampered)).rejects.toBeInstanceOf(AppError);
  });

  it('rejects an expired token', async () => {
    const past = Math.floor(Date.now() / 1000) - ACCESS_TOKEN_TTL_SECONDS - 60;
    const token = await signAccessToken(
      { ...claims, roles: ['tenant_admin'] },
      past,
    );
    await expect(verifyAccessToken(token)).rejects.toBeInstanceOf(AppError);
  });

  it('rejects a refresh token presented as an access token (audience)', async () => {
    const refresh = await signRefreshToken({
      userId: claims.userId,
      tenantId: claims.tenantId,
      jti: 'abc',
    });
    await expect(verifyAccessToken(refresh)).rejects.toBeInstanceOf(AppError);
  });
});

describe('refresh tokens', () => {
  it('round-trips and preserves the jti', async () => {
    const token = await signRefreshToken({
      userId: claims.userId,
      tenantId: claims.tenantId,
      jti: 'device-token-id',
    });
    const decoded = await verifyRefreshToken(token);
    expect(decoded.userId).toBe(claims.userId);
    expect(decoded.jti).toBe('device-token-id');
  });

  it('hashes deterministically and never returns the raw token', () => {
    const token = 'some-refresh-token';
    const a = hashRefreshToken(token);
    const b = hashRefreshToken(token);
    expect(a).toBe(b);
    expect(a).not.toContain(token);
    expect(a).toHaveLength(64); // sha256 hex
  });
});
