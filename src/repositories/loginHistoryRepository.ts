import type { LoginHistory } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { type Db } from './types';

/**
 * Login history repository (PRD 2./5. fejezet – Munkamenet, Audit).
 *
 * Append-only record of authentication attempts (both successes and failures),
 * used for security review and device management. `tenantId`/`userId` may be
 * null when an attempt cannot be attributed to a known account.
 */
type LoginHistoryDb = Db<'loginHistory'>;

/** Fields captured for a single login attempt. */
export interface RecordLoginInput {
  tenantId?: string | null | undefined;
  userId?: string | null | undefined;
  success: boolean;
  ipAddress?: string | undefined;
  browser?: string | undefined;
  os?: string | undefined;
  device?: string | undefined;
}

export interface LoginHistoryRepository {
  record(input: RecordLoginInput): Promise<LoginHistory>;
}

export function createLoginHistoryRepository(
  db: LoginHistoryDb,
): LoginHistoryRepository {
  return {
    record(input) {
      return db.loginHistory.create({
        data: {
          tenantId: input.tenantId ?? null,
          userId: input.userId ?? null,
          success: input.success,
          ipAddress: input.ipAddress ?? null,
          browser: input.browser ?? null,
          os: input.os ?? null,
          device: input.device ?? null,
        },
      });
    },
  };
}

/** Production instance bound to the shared Prisma singleton. */
export const loginHistoryRepository = createLoginHistoryRepository(prisma);
