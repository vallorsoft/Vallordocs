import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { NotFoundError, ValidationError } from '@/shared/errors';
import type {
  PutObjectInput,
  StorageProvider,
  StoredObjectMetadata,
} from './types';

/**
 * Filesystem-backed storage provider for the Fly.io Volume (PRD 3. fejezet –
 * Első verzió). All files live under a single root directory that maps to the
 * mounted volume. Keys are resolved relative to that root and can never escape
 * it (path-traversal protection).
 */
export class FlyVolumeStorageProvider implements StorageProvider {
  readonly name = 'fly' as const;
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  private resolvePath(key: string): string {
    const target = resolve(join(this.root, key));
    // The resolved path must stay strictly inside the root directory.
    if (target !== this.root && !target.startsWith(this.root + sep)) {
      throw new ValidationError({
        messageKey: 'errors.validation',
        context: { reason: 'path traversal outside storage root' },
      });
    }
    return target;
  }

  async put(input: PutObjectInput): Promise<StoredObjectMetadata> {
    const target = this.resolvePath(input.key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, input.data);

    return {
      key: input.key,
      size: input.data.byteLength,
      contentType: input.contentType,
      checksum: createHash('sha256').update(input.data).digest('hex'),
    };
  }

  async get(key: string): Promise<Buffer> {
    const target = this.resolvePath(key);
    try {
      return await readFile(target);
    } catch {
      throw new NotFoundError({ reason: 'storage object not found' });
    }
  }

  async exists(key: string): Promise<boolean> {
    const target = this.resolvePath(key);
    try {
      await stat(target);
      return true;
    } catch {
      return false;
    }
  }

  async remove(key: string): Promise<void> {
    const target = this.resolvePath(key);
    // `force` makes removal idempotent: a missing object is not an error.
    await rm(target, { force: true });
  }
}
