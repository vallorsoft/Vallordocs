import type { Notification, NotificationType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { tenantScope, type TenantContext } from '@/modules/tenants';
import { normalizePagination, type Db, type Pagination } from './types';

/**
 * Notification repository (PRD 3./4. fejezet – Értesítések).
 *
 * A notification always belongs to both a tenant and a user. Reads are scoped to
 * the caller's own tenant *and* user id, and mark-read writes carry the same
 * predicate so one user can never touch another's notifications.
 */
type NotificationDb = Db<'notification'>;

/** Fields accepted when creating a notification. */
export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType | undefined;
}

export interface NotificationRepository {
  listForUser(ctx: TenantContext, page?: Pagination): Promise<Notification[]>;
  create(
    ctx: TenantContext,
    input: CreateNotificationInput,
  ): Promise<Notification>;
  markRead(ctx: TenantContext, id: string, at: Date): Promise<number>;
  markAllRead(ctx: TenantContext, at: Date): Promise<number>;
}

export function createNotificationRepository(
  db: NotificationDb,
): NotificationRepository {
  return {
    listForUser(ctx, page) {
      const { skip, take } = normalizePagination(page);
      return db.notification.findMany({
        where: { ...tenantScope(ctx), userId: ctx.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
    },

    create(ctx, input) {
      const tenant = tenantScope(ctx);
      return db.notification.create({
        data: {
          tenantId: tenant.tenantId,
          userId: input.userId,
          title: input.title,
          message: input.message,
          type: input.type,
        },
      });
    },

    async markRead(ctx, id, at) {
      const result = await db.notification.updateMany({
        where: { ...tenantScope(ctx), id, userId: ctx.userId, readAt: null },
        data: { readAt: at },
      });
      return result.count;
    },

    async markAllRead(ctx, at) {
      const result = await db.notification.updateMany({
        where: { ...tenantScope(ctx), userId: ctx.userId, readAt: null },
        data: { readAt: at },
      });
      return result.count;
    },
  };
}

/** Production instance bound to the shared Prisma singleton. */
export const notificationRepository = createNotificationRepository(prisma);
