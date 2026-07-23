import { randomUUID } from 'node:crypto';
import { ValidationError } from '@/shared/errors';

/**
 * Tenant-isolated storage key builder (PRD 3. fejezet – Fájlstruktúra, 5.
 * fejezet – Storage biztonság).
 *
 * Every tenant gets a completely separate directory subtree. File names are
 * UUID-based so they are never guessable, and there is no public URL - keys are
 * resolved by the storage provider behind an authorisation check.
 *
 *   {tenantId}/documents/{tripId}/{documentId}/{variant}/{uuid}.{ext}
 */

export const STORAGE_VARIANTS = [
  'original',
  'processed',
  'pdf',
  'thumbnail',
  'preview',
] as const;

export type StorageVariant = (typeof STORAGE_VARIANTS)[number];

/** A path segment must be a non-empty, safe identifier (no separators, no dots). */
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;

function assertSafeSegment(segment: string, label: string): void {
  if (
    !segment ||
    segment === '.' ||
    segment === '..' ||
    segment.includes('/') ||
    segment.includes('\\') ||
    !SAFE_SEGMENT.test(segment)
  ) {
    throw new ValidationError({
      messageKey: 'errors.validation',
      context: { invalidPathSegment: label },
    });
  }
}

export interface StorageKeyParts {
  tenantId: string;
  tripId: string;
  documentId: string;
  variant: StorageVariant;
  /** File extension without a leading dot, e.g. `jpg`, `pdf`. */
  extension: string;
}

/**
 * Builds a fresh, unique storage key for a new object. The random UUID prevents
 * enumeration and collisions.
 */
export function buildStorageKey(parts: StorageKeyParts): string {
  assertSafeSegment(parts.tenantId, 'tenantId');
  assertSafeSegment(parts.tripId, 'tripId');
  assertSafeSegment(parts.documentId, 'documentId');

  const extension = parts.extension.replace(/^\./, '').toLowerCase();
  assertSafeSegment(extension, 'extension');

  return [
    parts.tenantId,
    'documents',
    parts.tripId,
    parts.documentId,
    parts.variant,
    `${randomUUID()}.${extension}`,
  ].join('/');
}

/**
 * Returns the tenant-id prefix of a key. Used by the provider layer to assert
 * that a caller only ever touches keys inside its own tenant subtree.
 */
export function tenantPrefixOf(key: string): string | null {
  const first = key.split('/')[0];
  return first && first.length > 0 ? first : null;
}

/**
 * Asserts that a storage key belongs to the given tenant. Defence in depth on
 * top of the higher-level tenant context checks.
 */
export function assertKeyBelongsToTenant(key: string, tenantId: string): void {
  if (tenantPrefixOf(key) !== tenantId) {
    throw new ValidationError({
      messageKey: 'errors.validation',
      context: { reason: 'storage key outside tenant subtree' },
    });
  }
}
