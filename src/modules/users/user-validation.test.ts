import { describe, expect, it } from 'vitest';
import {
  parseUserProfile,
  safeParseUserProfile,
  selfProfileSchema,
  userProfileSchema,
} from './user-validation';

const valid = {
  name: 'Nagy Béla',
  email: 'Bela@Example.COM',
  roles: ['dispatcher'],
};

describe('userProfileSchema', () => {
  it('applies defaults and normalises email casing', () => {
    const result = parseUserProfile(valid);
    expect(result.email).toBe('bela@example.com');
    expect(result.language).toBe('hu');
    expect(result.timezone).toBe('Europe/Budapest');
    expect(result.status).toBe('invited');
  });

  it('rejects a too-short name with the i18n key', () => {
    const result = safeParseUserProfile({ ...valid, name: 'A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('validation.nameTooShort');
    }
  });

  it('rejects an invalid email', () => {
    const result = safeParseUserProfile({ ...valid, email: 'nope' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('validation.email');
    }
  });

  it('requires at least one role', () => {
    const result = safeParseUserProfile({ ...valid, roles: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('validation.rolesRequired');
    }
  });

  it('accepts an optional plausible phone', () => {
    expect(
      userProfileSchema.safeParse({ ...valid, phone: '+36 20 123 4567' })
        .success,
    ).toBe(true);
  });

  it('rejects an implausible phone', () => {
    const result = safeParseUserProfile({ ...valid, phone: 'abc' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('validation.phone');
    }
  });
});

describe('selfProfileSchema', () => {
  it('only permits self-editable fields', () => {
    expect(Object.keys(selfProfileSchema.shape).sort()).toEqual([
      'language',
      'name',
      'phone',
      'timezone',
    ]);
  });
});
