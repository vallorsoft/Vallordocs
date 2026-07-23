import { getEnv } from '@/config';
import { InternalError } from '@/shared/errors';
import { FlyVolumeStorageProvider } from './fly-volume-provider';
import type { StorageProvider } from './types';

/**
 * Storage provider factory (PRD 3./6. fejezet – Storage rendszer).
 *
 * The active provider is chosen purely from environment configuration. Only the
 * Fly Volume provider is implemented in this milestone; the remaining providers
 * (R2, S3, Azure, GCS) plug in behind the same interface without any change to
 * calling code.
 */

let cached: StorageProvider | null = null;

export function createStorageProvider(): StorageProvider {
  const env = getEnv();

  switch (env.STORAGE_PROVIDER) {
    case 'fly': {
      if (!env.FLY_STORAGE_PATH) {
        // env validation already guarantees this, but keep the type narrow.
        throw new InternalError({ message: 'FLY_STORAGE_PATH is not set' });
      }
      return new FlyVolumeStorageProvider(env.FLY_STORAGE_PATH);
    }
    case 'r2':
    case 's3':
    case 'azure':
    case 'gcs':
      throw new InternalError({
        message: `Storage provider not yet implemented: ${env.STORAGE_PROVIDER}`,
      });
    default: {
      // Exhaustiveness guard: a new provider enum value must be handled here.
      const exhaustive: never = env.STORAGE_PROVIDER;
      throw new InternalError({
        message: `Unknown storage provider: ${String(exhaustive)}`,
      });
    }
  }
}

/** Returns a process-wide cached provider instance. */
export function getStorageProvider(): StorageProvider {
  if (cached === null) {
    cached = createStorageProvider();
  }
  return cached;
}

/** Test-only helper to reset the cached provider. */
export function resetStorageProvider(): void {
  cached = null;
}
