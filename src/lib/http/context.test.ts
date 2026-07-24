// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resetEnvCache } from '@/config';
import { signAccessToken } from '@/modules/auth';
import { UnauthorizedError } from '@/shared/errors';
import { authenticate, bearerToken, clientMeta } from './context';

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

function request(headers: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost/api/me', { headers });
}

describe('bearerToken', () => {
  it('parses a well-formed Authorization header', () => {
    expect(bearerToken(request({ authorization: 'Bearer abc.def' }))).toBe(
      'abc.def',
    );
  });

  it('rejects a missing or malformed header', () => {
    expect(bearerToken(request({}))).toBeNull();
    expect(bearerToken(request({ authorization: 'abc.def' }))).toBeNull();
    expect(bearerToken(request({ authorization: 'Basic abc' }))).toBeNull();
  });
});

describe('authenticate', () => {
  it('builds the tenant context from a valid access token', async () => {
    const token = await signAccessToken({
      userId: '11111111-1111-1111-1111-111111111111',
      tenantId: '22222222-2222-2222-2222-222222222222',
      roles: ['dispatcher'],
      permissions: ['document.read', 'trip.write'],
    });

    const ctx = await authenticate(
      request({ authorization: `Bearer ${token}` }),
    );

    expect(ctx.userId).toBe('11111111-1111-1111-1111-111111111111');
    expect(ctx.tenantId).toBe('22222222-2222-2222-2222-222222222222');
    expect(ctx.roles).toEqual(['dispatcher']);
    expect(ctx.permissions).toContain('trip.write');
  });

  it('rejects a request with no bearer token', async () => {
    await expect(authenticate(request({}))).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('rejects a request with a bogus token', async () => {
    await expect(
      authenticate(request({ authorization: 'Bearer not-a-jwt' })),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe('clientMeta', () => {
  it('prefers the first x-forwarded-for hop and captures the UA', () => {
    const meta = clientMeta(
      request({
        'x-forwarded-for': '203.0.113.7, 10.0.0.1',
        'user-agent': 'Mozilla/5.0',
      }),
    );
    expect(meta.ipAddress).toBe('203.0.113.7');
    expect(meta.userAgent).toBe('Mozilla/5.0');
  });
});
