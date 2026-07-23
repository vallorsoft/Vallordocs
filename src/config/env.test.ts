import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

/**
 * A minimal valid environment used as a baseline for the cases below.
 */
function baseEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/vallordocs',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'x'.repeat(32),
    AI_PROVIDER: 'gemini',
    GEMINI_API_KEY: 'test-gemini-key',
    STORAGE_PROVIDER: 'fly',
    FLY_STORAGE_PATH: '/data/storage',
  };
}

describe('parseEnv', () => {
  it('parses a valid environment and applies defaults', () => {
    const env = parseEnv(baseEnv());

    expect(env.DEFAULT_LANGUAGE).toBe('hu');
    expect(env.DEFAULT_TIMEZONE).toBe('Europe/Budapest');
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.STORAGE_PROVIDER).toBe('fly');
  });

  it('rejects a short JWT secret', () => {
    expect(() => parseEnv({ ...baseEnv(), JWT_SECRET: 'too-short' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('requires DATABASE_URL', () => {
    const env = baseEnv();
    delete env.DATABASE_URL;
    expect(() => parseEnv(env)).toThrow(/DATABASE_URL/);
  });

  it('requires GEMINI_API_KEY when AI provider is gemini', () => {
    const env = baseEnv();
    delete env.GEMINI_API_KEY;
    expect(() => parseEnv(env)).toThrow(/GEMINI_API_KEY/);
  });

  it('requires all R2 secrets when storage provider is r2', () => {
    const env = {
      ...baseEnv(),
      STORAGE_PROVIDER: 'r2',
      FLY_STORAGE_PATH: undefined,
    };
    expect(() => parseEnv(env)).toThrow(/R2_ACCOUNT_ID/);
  });

  it('accepts a fully configured r2 storage provider', () => {
    const env = parseEnv({
      ...baseEnv(),
      STORAGE_PROVIDER: 'r2',
      R2_ACCOUNT_ID: 'acc',
      R2_ACCESS_KEY: 'key',
      R2_SECRET_KEY: 'secret',
      R2_BUCKET: 'bucket',
    });
    expect(env.STORAGE_PROVIDER).toBe('r2');
  });

  it('does not leak secret values in the error message', () => {
    const env = baseEnv();
    env.JWT_SECRET = 'short';
    try {
      parseEnv(env);
      expect.unreachable('parseEnv should have thrown');
    } catch (error) {
      expect((error as Error).message).not.toContain('short');
    }
  });
});
