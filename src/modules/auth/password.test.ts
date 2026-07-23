import { describe, expect, it } from 'vitest';
import {
  checkPasswordStrength,
  assertPasswordStrength,
  hashPassword,
  verifyPassword,
} from './password';
import { AppError } from '@/shared/errors';

const STRONG = 'Str0ng!Passw0rd';

describe('checkPasswordStrength', () => {
  it('accepts a password meeting every rule', () => {
    expect(checkPasswordStrength(STRONG)).toEqual({ valid: true, failed: [] });
  });

  it('reports each individual failed rule', () => {
    // Too short, no uppercase, no digit, no special.
    expect(checkPasswordStrength('abc').failed).toEqual(
      expect.arrayContaining(['length', 'uppercase', 'digit', 'special']),
    );
  });

  it('flags a long password that still lacks a special character', () => {
    expect(checkPasswordStrength('Abcdefgh1234').failed).toEqual(['special']);
  });
});

describe('assertPasswordStrength', () => {
  it('throws a validation AppError for a weak password', () => {
    try {
      assertPasswordStrength('weak');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('VALIDATION');
    }
  });

  it('does not leak the password in the error', () => {
    try {
      assertPasswordStrength('secretweak');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(JSON.stringify((error as AppError).toPublicJSON())).not.toContain(
        'secretweak',
      );
    }
  });
});

describe('hashPassword / verifyPassword', () => {
  it('hashes to an argon2id encoded string, not the plaintext', async () => {
    const hashed = await hashPassword(STRONG);
    expect(hashed).toMatch(/^\$argon2id\$/);
    expect(hashed).not.toContain(STRONG);
  });

  it('produces a different hash each time (random salt)', async () => {
    const a = await hashPassword(STRONG);
    const b = await hashPassword(STRONG);
    expect(a).not.toBe(b);
  });

  it('verifies a correct password and rejects a wrong one', async () => {
    const hashed = await hashPassword(STRONG);
    expect(await verifyPassword(hashed, STRONG)).toBe(true);
    expect(await verifyPassword(hashed, 'Wr0ng!Passw0rd')).toBe(false);
  });

  it('returns false for a malformed hash instead of throwing', async () => {
    expect(await verifyPassword('not-a-hash', STRONG)).toBe(false);
  });

  it('refuses to hash a password that violates the policy', async () => {
    await expect(hashPassword('weak')).rejects.toBeInstanceOf(AppError);
  });
});
