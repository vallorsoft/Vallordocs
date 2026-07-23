/**
 * Public API of the storage module (PRD 3. fejezet – Storage rendszer).
 */
export {
  STORAGE_VARIANTS,
  buildStorageKey,
  tenantPrefixOf,
  assertKeyBelongsToTenant,
  type StorageVariant,
  type StorageKeyParts,
} from './paths';

export { FlyVolumeStorageProvider } from './fly-volume-provider';

export {
  createStorageProvider,
  getStorageProvider,
  resetStorageProvider,
} from './factory';

export type {
  StorageProvider,
  StoredObjectMetadata,
  PutObjectInput,
} from './types';
