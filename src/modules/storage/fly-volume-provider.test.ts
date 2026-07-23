import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FlyVolumeStorageProvider } from './fly-volume-provider';
import { AppError } from '@/shared/errors';

describe('FlyVolumeStorageProvider', () => {
  let root: string;
  let provider: FlyVolumeStorageProvider;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'vallordocs-storage-'));
    provider = new FlyVolumeStorageProvider(root);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  const key = 'tenant-1/documents/trip-1/doc-1/original/file.bin';
  const data = Buffer.from('hello vallordocs');

  it('round-trips an object and reports size + checksum', async () => {
    const meta = await provider.put({
      key,
      data,
      contentType: 'application/octet-stream',
    });
    expect(meta.size).toBe(data.byteLength);
    expect(meta.checksum).toHaveLength(64);

    const read = await provider.get(key);
    expect(read.equals(data)).toBe(true);
  });

  it('reports existence correctly', async () => {
    expect(await provider.exists(key)).toBe(false);
    await provider.put({ key, data, contentType: 'text/plain' });
    expect(await provider.exists(key)).toBe(true);
  });

  it('removes idempotently', async () => {
    await provider.put({ key, data, contentType: 'text/plain' });
    await provider.remove(key);
    expect(await provider.exists(key)).toBe(false);
    // Removing again does not throw.
    await expect(provider.remove(key)).resolves.toBeUndefined();
  });

  it('throws NotFoundError when reading a missing object', async () => {
    await expect(provider.get('tenant-1/missing.bin')).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it('refuses to escape the storage root', async () => {
    await expect(provider.get('../../../etc/passwd')).rejects.toBeInstanceOf(
      AppError,
    );
    await expect(
      provider.put({
        key: '../escape.bin',
        data,
        contentType: 'text/plain',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
