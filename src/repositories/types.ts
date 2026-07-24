import type { PrismaClient } from '@prisma/client';

/**
 * Shared repository infrastructure (PRD 7. fejezet – Adatelérési réteg).
 *
 * Repositories are the *only* layer allowed to touch Prisma directly. Every
 * repository is a factory that takes an injected, structurally-typed client so
 * it can be unit tested with a plain mock — the production wiring passes the
 * real {@link PrismaClient} singleton, tests pass a fake exposing only the
 * model delegates the repository uses.
 *
 * `Db<M>` narrows the client to exactly the model delegates a repository needs.
 * This both documents each repository's data surface and lets a test mock
 * implement the minimum.
 */
export type Db<M extends keyof PrismaClient> = Pick<PrismaClient, M>;

/**
 * Pagination bounds shared by list queries. Kept intentionally small; the
 * repository clamps them so a caller can never request an unbounded scan.
 */
export interface Pagination {
  /** Zero-based number of rows to skip. */
  skip?: number;
  /** Maximum rows to return. */
  take?: number;
}

/** Upper bound on any single page, guarding against unbounded reads. */
export const MAX_PAGE_SIZE = 200;
/** Default page size when a caller does not specify one. */
export const DEFAULT_PAGE_SIZE = 50;

/** Clamps caller-supplied pagination into safe `{ skip, take }` bounds. */
export function normalizePagination(input: Pagination = {}): {
  skip: number;
  take: number;
} {
  const skip = Number.isFinite(input.skip) ? Math.max(0, input.skip ?? 0) : 0;
  const rawTake = Number.isFinite(input.take)
    ? (input.take ?? DEFAULT_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;
  const take = Math.min(MAX_PAGE_SIZE, Math.max(1, rawTake));
  return { skip, take };
}
