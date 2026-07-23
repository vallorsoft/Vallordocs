import { RateLimitedError } from '@/shared/errors';

/**
 * Fixed-window rate limiting and brute-force protection (PRD 5. fejezet –
 * Rate Limit, Brute Force blokkolás).
 *
 * The limiter is pure window math over an injectable store and clock, so it is
 * fully deterministic and unit-testable. It is deliberately transport-agnostic:
 * the caller decides the `identifier` (client IP for anonymous traffic, userId
 * for authenticated traffic) and which `action` policy applies. No wall-clock
 * or global state leaks in — everything flows through the injected `clock`.
 */

/** Actions that carry an independent rate-limit budget. */
export type RateLimitAction = 'login' | 'upload' | 'ai' | 'api';

/** A single fixed-window policy: at most `max` hits per `windowMs`. */
export interface RateLimitPolicy {
  /** Length of the fixed window in milliseconds. */
  windowMs: number;
  /** Maximum number of allowed hits within one window. */
  max: number;
}

/**
 * Per-action policies. `login` is the tightest to blunt brute-force attempts;
 * `api` is the most permissive general bucket.
 */
export const RATE_LIMIT_POLICIES: Record<RateLimitAction, RateLimitPolicy> = {
  login: { windowMs: 60_000, max: 5 },
  upload: { windowMs: 60_000, max: 30 },
  ai: { windowMs: 60_000, max: 20 },
  api: { windowMs: 60_000, max: 100 },
};

/** Internal counter record persisted per key for the lifetime of a window. */
export interface RateLimitEntry {
  /** Number of hits recorded in the current window. */
  count: number;
  /** Epoch-ms timestamp at which the current window resets. */
  resetAt: number;
}

/**
 * Storage abstraction for counters. The in-memory implementation ships here;
 * a distributed backend (Redis) can implement the same interface later without
 * touching {@link RateLimiter}.
 */
export interface RateLimiterStore {
  get(key: string): RateLimitEntry | undefined;
  set(key: string, value: RateLimitEntry, ttlMs: number): void;
}

interface StoredEntry {
  value: RateLimitEntry;
  /** Epoch-ms after which the entry is considered expired and evicted. */
  expiresAt: number;
}

/**
 * Process-local store. Suitable for a single instance; entries expire on their
 * TTL and are evicted lazily on access or eagerly via {@link prune}.
 */
export class InMemoryRateLimiterStore implements RateLimiterStore {
  private readonly map = new Map<string, StoredEntry>();

  constructor(private readonly clock: () => number = Date.now) {}

  get(key: string): RateLimitEntry | undefined {
    const stored = this.map.get(key);
    if (stored === undefined) return undefined;
    if (stored.expiresAt <= this.clock()) {
      this.map.delete(key);
      return undefined;
    }
    return stored.value;
  }

  set(key: string, value: RateLimitEntry, ttlMs: number): void {
    this.map.set(key, { value, expiresAt: this.clock() + ttlMs });
  }

  /** Evicts every entry whose TTL has elapsed. */
  prune(): void {
    const now = this.clock();
    for (const [key, stored] of this.map) {
      if (stored.expiresAt <= now) this.map.delete(key);
    }
  }

  /** Current number of tracked keys (before lazy eviction). */
  get size(): number {
    return this.map.size;
  }
}

/** Outcome of a rate-limit inspection. */
export interface RateLimitResult {
  /** Whether the request is within budget. */
  allowed: boolean;
  /** Hits still available in the current window (never negative). */
  remaining: number;
  /** Epoch-ms timestamp at which the window resets. */
  resetAt: number;
}

/** Identifies a specific counter: an action policy plus a caller identity. */
export interface RateLimitTarget {
  action: RateLimitAction;
  /** Client IP or userId — whatever the caller chooses to bucket by. */
  identifier: string;
}

/**
 * Fixed-window rate limiter. `check` inspects without mutating, `consume`
 * records a hit, and `assert` records a hit and throws when the budget is
 * exhausted.
 */
export class RateLimiter {
  constructor(
    private readonly store: RateLimiterStore,
    private readonly clock: () => number = Date.now,
    private readonly policies: Record<
      RateLimitAction,
      RateLimitPolicy
    > = RATE_LIMIT_POLICIES,
  ) {}

  private keyFor(target: RateLimitTarget): string {
    return `${target.action}:${target.identifier}`;
  }

  /**
   * Reports the current budget without recording a hit. A fresh or expired
   * window reports full remaining budget.
   */
  check(target: RateLimitTarget): RateLimitResult {
    const policy = this.policies[target.action];
    const now = this.clock();
    const entry = this.store.get(this.keyFor(target));

    if (entry === undefined || entry.resetAt <= now) {
      return {
        allowed: policy.max > 0,
        remaining: policy.max,
        resetAt: now + policy.windowMs,
      };
    }

    const remaining = Math.max(0, policy.max - entry.count);
    return {
      allowed: entry.count < policy.max,
      remaining,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Records one hit against the window and returns the resulting budget. When
   * the window is already exhausted the count still increments (so repeated
   * abuse keeps the window pinned) but it never throws.
   */
  consume(target: RateLimitTarget): RateLimitResult {
    const policy = this.policies[target.action];
    const now = this.clock();
    const key = this.keyFor(target);
    const existing = this.store.get(key);

    const window: RateLimitEntry =
      existing === undefined || existing.resetAt <= now
        ? { count: 0, resetAt: now + policy.windowMs }
        : existing;

    const next: RateLimitEntry = {
      count: window.count + 1,
      resetAt: window.resetAt,
    };
    this.store.set(key, next, Math.max(0, next.resetAt - now));

    const remaining = Math.max(0, policy.max - next.count);
    return {
      allowed: next.count <= policy.max,
      remaining,
      resetAt: next.resetAt,
    };
  }

  /**
   * Records a hit and throws {@link RateLimitedError} when the budget is
   * exceeded. The error context carries the action and reset time for logging;
   * only the safe translated message key reaches the client.
   */
  assert(target: RateLimitTarget): RateLimitResult {
    const result = this.consume(target);
    if (!result.allowed) {
      throw new RateLimitedError({
        action: target.action,
        resetAt: result.resetAt,
      });
    }
    return result;
  }
}
