import type { RefreshToken } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { type Db } from './types';

/**
 * Refresh token repository (PRD 2./5. fejezet – Munkamenet, Eszközkezelés).
 *
 * Only the SHA-256 hash of a refresh token is ever persisted, so a database
 * leak never exposes usable tokens. Tokens are keyed by user; rotation revokes
 * the old row and issues a new one.
 */
type RefreshTokenDb = Db<'refreshToken'>;

/** Fields captured when persisting a freshly-issued refresh token. */
export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  device?: string | undefined;
  ipAddress?: string | undefined;
}

export interface RefreshTokenRepository {
  create(input: CreateRefreshTokenInput): Promise<RefreshToken>;
  findActiveByHash(tokenHash: string, now: Date): Promise<RefreshToken | null>;
  revokeByHash(tokenHash: string, at: Date): Promise<number>;
  revokeAllForUser(userId: string, at: Date): Promise<number>;
}

export function createRefreshTokenRepository(
  db: RefreshTokenDb,
): RefreshTokenRepository {
  return {
    create(input) {
      return db.refreshToken.create({
        data: {
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          device: input.device ?? null,
          ipAddress: input.ipAddress ?? null,
        },
      });
    },

    findActiveByHash(tokenHash, now) {
      return db.refreshToken.findFirst({
        where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
      });
    },

    async revokeByHash(tokenHash, at) {
      const result = await db.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: at },
      });
      return result.count;
    },

    async revokeAllForUser(userId, at) {
      const result = await db.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: at },
      });
      return result.count;
    },
  };
}

/** Production instance bound to the shared Prisma singleton. */
export const refreshTokenRepository = createRefreshTokenRepository(prisma);
