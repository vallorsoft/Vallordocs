import type { AiJob, AiProvider } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { tenantScope, type TenantContext } from '@/modules/tenants';
import { normalizePagination, type Db, type Pagination } from './types';

/**
 * AI job aggregate repository (PRD 3. fejezet – AI dokumentumfeldolgozás).
 *
 * Enqueues and lists AI restoration jobs. Every query is tenant-scoped; a job is
 * always created in `queued` status and picked up by the background worker in a
 * later milestone.
 */
type AiJobDb = Db<'aiJob'>;

/** Fields accepted when enqueueing an AI job. */
export interface EnqueueAiJobInput {
  documentId: string;
  provider?: AiProvider | undefined;
  model?: string | undefined;
}

export interface AiJobRepository {
  listByTenant(ctx: TenantContext, page?: Pagination): Promise<AiJob[]>;
  enqueue(ctx: TenantContext, input: EnqueueAiJobInput): Promise<AiJob>;
}

export function createAiJobRepository(db: AiJobDb): AiJobRepository {
  return {
    listByTenant(ctx, page) {
      const { skip, take } = normalizePagination(page);
      return db.aiJob.findMany({
        where: tenantScope(ctx, { includeDeleted: true }),
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
    },

    enqueue(ctx, input) {
      const tenant = tenantScope(ctx);
      return db.aiJob.create({
        data: {
          tenantId: tenant.tenantId,
          documentId: input.documentId,
          provider: input.provider,
          model: input.model ?? null,
          status: 'queued',
        },
      });
    },
  };
}

/** Production instance bound to the shared Prisma singleton. */
export const aiJobRepository = createAiJobRepository(prisma);
