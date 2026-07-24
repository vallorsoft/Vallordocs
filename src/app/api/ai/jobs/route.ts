import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { AiProvider } from '@prisma/client';
import { PERMISSIONS, requirePermission } from '@/modules/auth';
import { buildAuditEntry } from '@/modules/audit';
import { authenticate, clientMeta, json, route } from '@/lib/http';
import { aiJobRepository, auditRepository } from '@/repositories';

/**
 * `GET /api/ai/jobs` — list tenant AI jobs; `POST /api/ai/jobs` — enqueue a
 * restoration job for a document. Both require `ai.execute`.
 * PRD 3. fejezet – AI dokumentumfeldolgozás.
 */
export const dynamic = 'force-dynamic';

const enqueueSchema = z.object({
  documentId: z.string().uuid(),
  provider: z.nativeEnum(AiProvider).optional(),
  model: z.string().min(1).optional(),
});

export const GET = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.AI_EXECUTE);
  const jobs = await aiJobRepository.listByTenant(ctx);
  return json({ jobs });
});

export const POST = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.AI_EXECUTE);
  const input = enqueueSchema.parse(await request.json());

  const job = await aiJobRepository.enqueue(ctx, {
    documentId: input.documentId,
    provider: input.provider,
    model: input.model,
  });

  const meta = clientMeta(request);
  await auditRepository.record(
    buildAuditEntry({
      actor: {
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        ipAddress: meta.ipAddress,
      },
      action: 'document.ai_process',
      details: { entity: 'aiJob', entityId: job.id },
    }),
  );

  return json({ job }, 201);
});
