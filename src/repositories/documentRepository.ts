import type { Document, DocumentType, DocumentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { tenantScope, type TenantContext } from '@/modules/tenants';
import { normalizePagination, type Db, type Pagination } from './types';

/**
 * Document aggregate repository (PRD 3. fejezet – Dokumentumfeldolgozás).
 *
 * This milestone persists document *metadata* only (type, associations, status);
 * binary content lives in the storage layer and is linked via DocumentVersion in
 * later work. Every query is tenant-scoped.
 */
type DocumentDb = Db<'document'>;

/** Fields accepted when creating a document metadata record. */
export interface CreateDocumentInput {
  documentType: DocumentType;
  tripId?: string | undefined;
  driverId?: string | undefined;
  status?: DocumentStatus | undefined;
}

export interface DocumentRepository {
  listByTenant(ctx: TenantContext, page?: Pagination): Promise<Document[]>;
  findById(ctx: TenantContext, id: string): Promise<Document | null>;
  create(ctx: TenantContext, input: CreateDocumentInput): Promise<Document>;
}

export function createDocumentRepository(db: DocumentDb): DocumentRepository {
  return {
    listByTenant(ctx, page) {
      const { skip, take } = normalizePagination(page);
      return db.document.findMany({
        where: tenantScope(ctx),
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
    },

    findById(ctx, id) {
      return db.document.findFirst({ where: { ...tenantScope(ctx), id } });
    },

    create(ctx, input) {
      const tenant = tenantScope(ctx);
      return db.document.create({
        data: {
          tenantId: tenant.tenantId,
          documentType: input.documentType,
          tripId: input.tripId ?? null,
          driverId: input.driverId ?? null,
          status: input.status,
          createdBy: ctx.userId,
        },
      });
    },
  };
}

/** Production instance bound to the shared Prisma singleton. */
export const documentRepository = createDocumentRepository(prisma);
