import { describe, expect, it } from 'vitest';
import {
  enqueue,
  dueItems,
  markInFlight,
  markDone,
  markFailed,
  deadLettered,
  pendingCount,
  DEFAULT_BASE_DELAY_MS,
  DEFAULT_MAX_DELAY_MS,
  DEFAULT_MAX_ATTEMPTS,
  type SyncItem,
} from './sync-queue';

function makeItem(overrides: Partial<SyncItem> = {}): SyncItem {
  return {
    id: 'a',
    kind: 'document_upload',
    createdAt: 0,
    attempts: 0,
    nextAttemptAt: 0,
    status: 'pending',
    payloadRef: 'blob:a',
    ...overrides,
  };
}

describe('enqueue', () => {
  it('appends a new item', () => {
    const q = enqueue([], makeItem({ id: 'a' }));
    expect(q).toHaveLength(1);
    expect(q[0]?.id).toBe('a');
  });

  it('is idempotent — the same id is never added twice', () => {
    const first = enqueue([], makeItem({ id: 'a' }));
    const second = enqueue(
      first,
      makeItem({ id: 'a', payloadRef: 'blob:dup' }),
    );
    expect(second).toHaveLength(1);
    // Original item is preserved, not overwritten by the duplicate.
    expect(second[0]?.payloadRef).toBe('blob:a');
  });

  it('does not mutate the input queue', () => {
    const input: SyncItem[] = [];
    const out = enqueue(input, makeItem({ id: 'a' }));
    expect(input).toHaveLength(0);
    expect(out).not.toBe(input);
  });
});

describe('dueItems', () => {
  it('returns only pending items whose nextAttemptAt <= now', () => {
    const queue = [
      makeItem({ id: 'a', nextAttemptAt: 100 }),
      makeItem({ id: 'b', nextAttemptAt: 300 }),
      makeItem({ id: 'c', nextAttemptAt: 50, status: 'in_flight' }),
      makeItem({ id: 'd', nextAttemptAt: 50, status: 'done' }),
      makeItem({ id: 'e', nextAttemptAt: 50, status: 'failed' }),
    ];
    const due = dueItems(queue, 200);
    expect(due.map((i) => i.id)).toEqual(['a']);
  });

  it('orders by createdAt then id (FIFO, stable tie-break)', () => {
    const queue = [
      makeItem({ id: 'z', createdAt: 10 }),
      makeItem({ id: 'm', createdAt: 5 }),
      makeItem({ id: 'a', createdAt: 5 }),
      makeItem({ id: 'b', createdAt: 1 }),
    ];
    const due = dueItems(queue, 1000);
    expect(due.map((i) => i.id)).toEqual(['b', 'a', 'm', 'z']);
  });

  it('does not mutate the input queue', () => {
    const queue = [makeItem({ id: 'a' })];
    dueItems(queue, 10);
    expect(queue).toHaveLength(1);
  });
});

describe('markInFlight / markDone', () => {
  it('sets status to in_flight', () => {
    const q = markInFlight([makeItem({ id: 'a' })], 'a');
    expect(q[0]?.status).toBe('in_flight');
  });

  it('sets status to done', () => {
    const q = markDone([makeItem({ id: 'a', status: 'in_flight' })], 'a');
    expect(q[0]?.status).toBe('done');
  });

  it('leaves non-matching items untouched', () => {
    const queue = [makeItem({ id: 'a' }), makeItem({ id: 'b' })];
    const q = markInFlight(queue, 'a');
    expect(q[1]?.status).toBe('pending');
  });

  it('does not mutate the input item', () => {
    const item = makeItem({ id: 'a' });
    markDone([item], 'a');
    expect(item.status).toBe('pending');
  });
});

describe('markFailed backoff schedule', () => {
  it('follows base * 2^attempts against the pre-increment attempt count', () => {
    // attempts=0 -> delay = base * 2^0 = base
    let q = markFailed([makeItem({ id: 'a', attempts: 0 })], 'a', 1000);
    expect(q[0]?.attempts).toBe(1);
    expect(q[0]?.nextAttemptAt).toBe(1000 + DEFAULT_BASE_DELAY_MS);
    expect(q[0]?.status).toBe('pending');

    // attempts=1 -> delay = base * 2
    q = markFailed([makeItem({ id: 'a', attempts: 1 })], 'a', 1000);
    expect(q[0]?.nextAttemptAt).toBe(1000 + DEFAULT_BASE_DELAY_MS * 2);

    // attempts=2 -> delay = base * 4
    q = markFailed([makeItem({ id: 'a', attempts: 2 })], 'a', 1000);
    expect(q[0]?.nextAttemptAt).toBe(1000 + DEFAULT_BASE_DELAY_MS * 4);

    // attempts=3 -> delay = base * 8
    q = markFailed([makeItem({ id: 'a', attempts: 3 })], 'a', 1000);
    expect(q[0]?.nextAttemptAt).toBe(1000 + DEFAULT_BASE_DELAY_MS * 8);
  });

  it('is deterministic (no jitter): repeated calls give identical schedules', () => {
    const a = markFailed([makeItem({ id: 'a', attempts: 2 })], 'a', 5000);
    const b = markFailed([makeItem({ id: 'a', attempts: 2 })], 'a', 5000);
    expect(a[0]?.nextAttemptAt).toBe(b[0]?.nextAttemptAt);
  });

  it('caps the delay at maxDelayMs', () => {
    // A large attempt count would overflow the cap; delay must clamp.
    const q = markFailed([makeItem({ id: 'a', attempts: 20 })], 'a', 0, {
      maxAttempts: 100,
    });
    expect(q[0]?.nextAttemptAt).toBe(DEFAULT_MAX_DELAY_MS);
  });

  it('honours overridden options', () => {
    const q = markFailed([makeItem({ id: 'a', attempts: 0 })], 'a', 0, {
      baseDelayMs: 100,
      maxDelayMs: 1000,
      maxAttempts: 3,
    });
    expect(q[0]?.nextAttemptAt).toBe(100);
  });

  it('does not mutate the input item', () => {
    const item = makeItem({ id: 'a', attempts: 0 });
    markFailed([item], 'a', 1000);
    expect(item.attempts).toBe(0);
    expect(item.nextAttemptAt).toBe(0);
  });
});

describe('dead-lettering', () => {
  it('flips to failed permanently once attempts reach maxAttempts', () => {
    // One attempt away from the default limit.
    const q = markFailed(
      [makeItem({ id: 'a', attempts: DEFAULT_MAX_ATTEMPTS - 1 })],
      'a',
      1000,
    );
    expect(q[0]?.attempts).toBe(DEFAULT_MAX_ATTEMPTS);
    expect(q[0]?.status).toBe('failed');
  });

  it('stays pending while attempts remain below the limit', () => {
    const q = markFailed([makeItem({ id: 'a', attempts: 0 })], 'a', 1000);
    expect(q[0]?.status).toBe('pending');
  });

  it('walks an item through the full retry lifecycle to dead-letter', () => {
    let queue = [makeItem({ id: 'a', attempts: 0 })];
    for (let i = 0; i < DEFAULT_MAX_ATTEMPTS; i += 1) {
      queue = markFailed(queue, 'a', i * 1000);
    }
    expect(queue[0]?.attempts).toBe(DEFAULT_MAX_ATTEMPTS);
    expect(queue[0]?.status).toBe('failed');
    expect(deadLettered(queue).map((i) => i.id)).toEqual(['a']);
  });
});

describe('selectors', () => {
  it('deadLettered returns only failed items', () => {
    const queue = [
      makeItem({ id: 'a', status: 'failed' }),
      makeItem({ id: 'b', status: 'pending' }),
      makeItem({ id: 'c', status: 'failed' }),
    ];
    expect(deadLettered(queue).map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('pendingCount counts only pending items', () => {
    const queue = [
      makeItem({ id: 'a', status: 'pending' }),
      makeItem({ id: 'b', status: 'in_flight' }),
      makeItem({ id: 'c', status: 'pending' }),
      makeItem({ id: 'd', status: 'done' }),
      makeItem({ id: 'e', status: 'failed' }),
    ];
    expect(pendingCount(queue)).toBe(2);
  });
});
