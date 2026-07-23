import { describe, expect, it } from 'vitest';
import { RateLimitedError } from '@/shared/errors';
import {
  InMemoryRateLimiterStore,
  RateLimiter,
  RATE_LIMIT_POLICIES,
} from './rate-limit';

/** Mutable clock helper for deterministic window math. */
function makeClock(start = 0): {
  now: () => number;
  advance: (ms: number) => void;
} {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

function makeLimiter(startAt = 0): {
  limiter: RateLimiter;
  store: InMemoryRateLimiterStore;
  advance: (ms: number) => void;
} {
  const clock = makeClock(startAt);
  const store = new InMemoryRateLimiterStore(clock.now);
  const limiter = new RateLimiter(store, clock.now);
  return { limiter, store, advance: clock.advance };
}

describe('RateLimiter.consume', () => {
  it('enforces the per-action limit', () => {
    const { limiter } = makeLimiter();
    const max = RATE_LIMIT_POLICIES.login.max;

    for (let i = 0; i < max; i += 1) {
      expect(
        limiter.consume({ action: 'login', identifier: 'ip' }).allowed,
      ).toBe(true);
    }
    // The (max + 1)-th hit is refused.
    expect(limiter.consume({ action: 'login', identifier: 'ip' }).allowed).toBe(
      false,
    );
  });

  it('reports a decreasing remaining count', () => {
    const { limiter } = makeLimiter();
    const max = RATE_LIMIT_POLICIES.login.max;

    const first = limiter.consume({ action: 'login', identifier: 'ip' });
    expect(first.remaining).toBe(max - 1);

    const second = limiter.consume({ action: 'login', identifier: 'ip' });
    expect(second.remaining).toBe(max - 2);
  });

  it('resets the window after windowMs elapses', () => {
    const { limiter, advance } = makeLimiter();
    const { windowMs, max } = RATE_LIMIT_POLICIES.login;

    for (let i = 0; i < max; i += 1) {
      limiter.consume({ action: 'login', identifier: 'ip' });
    }
    expect(limiter.check({ action: 'login', identifier: 'ip' }).allowed).toBe(
      false,
    );

    advance(windowMs);
    const afterReset = limiter.check({ action: 'login', identifier: 'ip' });
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(max);
  });

  it('isolates budgets per action and per identifier', () => {
    const { limiter } = makeLimiter();
    const max = RATE_LIMIT_POLICIES.login.max;

    for (let i = 0; i < max; i += 1) {
      limiter.consume({ action: 'login', identifier: 'alice' });
    }
    // Same identifier, different action → untouched.
    expect(limiter.check({ action: 'api', identifier: 'alice' }).allowed).toBe(
      true,
    );
    // Same action, different identifier → untouched.
    expect(limiter.check({ action: 'login', identifier: 'bob' }).allowed).toBe(
      true,
    );
  });

  it('never throws when the budget is exhausted', () => {
    const { limiter } = makeLimiter();
    const max = RATE_LIMIT_POLICIES.login.max;
    for (let i = 0; i < max + 3; i += 1) {
      expect(() =>
        limiter.consume({ action: 'login', identifier: 'ip' }),
      ).not.toThrow();
    }
    expect(limiter.check({ action: 'login', identifier: 'ip' }).remaining).toBe(
      0,
    );
  });
});

describe('RateLimiter.check', () => {
  it('does not record a hit', () => {
    const { limiter } = makeLimiter();
    const max = RATE_LIMIT_POLICIES.api.max;
    limiter.check({ action: 'api', identifier: 'ip' });
    limiter.check({ action: 'api', identifier: 'ip' });
    expect(limiter.check({ action: 'api', identifier: 'ip' }).remaining).toBe(
      max,
    );
  });
});

describe('RateLimiter.assert', () => {
  it('throws RateLimitedError once the budget is exceeded', () => {
    const { limiter } = makeLimiter();
    const max = RATE_LIMIT_POLICIES.login.max;

    for (let i = 0; i < max; i += 1) {
      expect(() =>
        limiter.assert({ action: 'login', identifier: 'ip' }),
      ).not.toThrow();
    }
    expect(() => limiter.assert({ action: 'login', identifier: 'ip' })).toThrow(
      RateLimitedError,
    );
  });
});

describe('InMemoryRateLimiterStore', () => {
  it('evicts entries once their TTL elapses', () => {
    const clock = makeClock();
    const store = new InMemoryRateLimiterStore(clock.now);
    store.set('k', { count: 1, resetAt: 100 }, 100);
    expect(store.get('k')).toBeDefined();

    clock.advance(100);
    expect(store.get('k')).toBeUndefined();
  });

  it('prunes expired entries eagerly', () => {
    const clock = makeClock();
    const store = new InMemoryRateLimiterStore(clock.now);
    store.set('a', { count: 1, resetAt: 50 }, 50);
    store.set('b', { count: 1, resetAt: 200 }, 200);
    clock.advance(100);
    store.prune();
    expect(store.size).toBe(1);
  });
});
