import { beforeEach, describe, expect, it, vi } from 'vitest';
import { drainUploads, enqueueUpload, pendingUploads } from './queue-store';

/**
 * The store persists to `localStorage` (provided by jsdom) over the pure,
 * already-tested queue logic, so these tests focus on the persistence and
 * delivery orchestration rather than the backoff maths.
 */
describe('offline queue store', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty', () => {
    expect(pendingUploads()).toBe(0);
  });

  it('enqueues uploads and counts them as pending', () => {
    enqueueUpload({ documentType: 'cmr' });
    enqueueUpload({ documentType: 'invoice', tripId: 't1' });
    expect(pendingUploads()).toBe(2);
  });

  it('delivers due items and clears them on success', async () => {
    enqueueUpload({ documentType: 'cmr' });
    enqueueUpload({ documentType: 'pod' });

    const deliver = vi.fn().mockResolvedValue(undefined);
    const delivered = await drainUploads(deliver);

    expect(delivered).toBe(2);
    expect(deliver).toHaveBeenCalledTimes(2);
    expect(pendingUploads()).toBe(0);
  });

  it('reschedules a failed item so it stays pending for a later retry', async () => {
    enqueueUpload({ documentType: 'cmr' });

    const deliver = vi.fn().mockRejectedValue(new Error('offline'));
    const delivered = await drainUploads(deliver, 1_000);

    expect(delivered).toBe(0);
    // Still queued (not dead-lettered on the first failure), just not yet due.
    expect(pendingUploads()).toBe(1);
  });
});
