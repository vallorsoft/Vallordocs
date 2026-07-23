import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetEnvCache } from '@/config';
import {
  createStorageProvider,
  getStorageProvider,
  resetStorageProvider,
} from './factory';
import { FlyVolumeStorageProvider } from './fly-volume-provider';
import { AppError } from '@/shared/errors';

const BASE_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/vallordocs',
  JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
} as const;

function setEnv(extra: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries({ ...BASE_ENV, ...extra })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetEnvCache();
  resetStorageProvider();
}

describe('createStorageProvider', () => {
  afterEach(() => {
    resetStorageProvider();
    resetEnvCache();
  });

  beforeEach(() => {
    // Clear provider-specific vars between cases.
    for (const key of [
      'R2_ACCOUNT_ID',
      'R2_ACCESS_KEY',
      'R2_SECRET_KEY',
      'R2_BUCKET',
    ]) {
      delete process.env[key];
    }
  });

  it('returns the Fly Volume provider when configured for fly', () => {
    setEnv({ STORAGE_PROVIDER: 'fly', FLY_STORAGE_PATH: '/tmp/storage' });
    expect(createStorageProvider()).toBeInstanceOf(FlyVolumeStorageProvider);
  });

  it('caches a single provider instance', () => {
    setEnv({ STORAGE_PROVIDER: 'fly', FLY_STORAGE_PATH: '/tmp/storage' });
    expect(getStorageProvider()).toBe(getStorageProvider());
  });

  it('throws for a not-yet-implemented provider', () => {
    setEnv({
      STORAGE_PROVIDER: 'r2',
      FLY_STORAGE_PATH: undefined,
      R2_ACCOUNT_ID: 'acc',
      R2_ACCESS_KEY: 'key',
      R2_SECRET_KEY: 'secret',
      R2_BUCKET: 'bucket',
    });
    expect(() => createStorageProvider()).toThrow(AppError);
  });
});
