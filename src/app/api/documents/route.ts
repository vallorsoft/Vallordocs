import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { DocumentType } from '@prisma/client';
import { PERMISSIONS, requirePermission } from '@/modules/auth';
import { buildAuditEntry } from '@/modules/audit';
import { authenticate, clientMeta, json, route } from '@/lib/http';
import { auditRepository, documentRepository } from '@/repositories';

/**
 * `GET /api/documents` — list tenant documents (`document.read`);
 * `POST /api/documents` — register a document's metadata (`document.write`).
 *
 * This endpoint creates the document row; the binary is handled by the storage
 * module and its own flow. PRD 3. fejezet – Dokumentumfeldolgozás.
 */
export const dynamic = 'force-dynamic';

const createDocumentSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  tripId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
});

export const GET = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.DOCUMENT_READ);
  const documents = await documentRepository.listByTenant(ctx);
  return json({ documents });
});

export const POST = route(async (request: NextRequest) => {
  const ctx = await authenticate(request);
  requirePermission(ctx, PERMISSIONS.DOCUMENT_WRITE);
  const input = createDocumentSchema.parse(await request.json());

  const document = await documentRepository.create(ctx, {
    documentType: input.documentType,
    tripId: input.tripId,
    driverId: input.driverId,
  });

  const meta = clientMeta(request);
  await auditRepository.record(
    buildAuditEntry({
      actor: {
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        ipAddress: meta.ipAddress,
      },
      action: 'document.upload',
      details: { entity: 'document', entityId: document.id },
    }),
  );

  return json({ document }, 201);
});
