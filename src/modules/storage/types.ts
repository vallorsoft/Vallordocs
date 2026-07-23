import type { StorageProvider as StorageProviderName } from '@prisma/client';

/**
 * Storage abstraction (PRD 3. fejezet – Storage rendszer).
 *
 * The application never talks to Fly, R2, S3, … directly. It depends only on
 * this interface, so switching providers is a configuration change, never a
 * code change. Objects are addressed by an opaque, tenant-isolated key; the
 * provider maps that key to its own backing store.
 */

export interface StoredObjectMetadata {
  key: string;
  size: number;
  contentType: string;
  checksum: string;
}

export interface PutObjectInput {
  key: string;
  data: Buffer;
  contentType: string;
}

export interface StorageProvider {
  /** Provider discriminator, mirrored into the `storage_files` table. */
  readonly name: StorageProviderName;
  /** Persists an object and returns its metadata (size + checksum). */
  put(input: PutObjectInput): Promise<StoredObjectMetadata>;
  /** Reads an object's bytes. Throws NotFoundError when absent. */
  get(key: string): Promise<Buffer>;
  /** True when an object exists at the key. */
  exists(key: string): Promise<boolean>;
  /** Removes an object. Idempotent: a missing object is not an error. */
  remove(key: string): Promise<void>;
}
