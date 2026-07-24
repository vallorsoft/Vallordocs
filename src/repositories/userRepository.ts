import type {
  Prisma,
  RoleName,
  UserStatus,
  Language,
  Timezone,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { tenantScope, type TenantContext } from '@/modules/tenants';
import { normalizePagination, type Db, type Pagination } from './types';

/**
 * User aggregate repository (PRD 2. fejezet – Felhasználók; 7. fejezet – Users).
 *
 * All tenant-scoped reads/writes go through {@link tenantScope} so a query can
 * never cross a tenant boundary. The one deliberate exception is
 * {@link UserRepository.findByEmailForAuth}, the pre-authentication login entry
 * point: at that moment there is no established tenant context yet, so the
 * lookup is keyed on the (globally addressable) email and the caller derives the
 * tenant from the row.
 */

/** Model delegates this repository touches. */
type UserDb = Db<'user'>;

/** A user row joined with its roles — the shape auth and `/me` consume. */
export type UserWithRoles = Prisma.UserGetPayload<{
  include: { userRoles: { include: { role: true } } };
}>;

const withRoles = {
  userRoles: { include: { role: true } },
} satisfies Prisma.UserInclude;

/** Fields accepted when creating a user; roles are attached by name. */
export interface CreateUserInput {
  name: string;
  email: string;
  phone?: string | undefined;
  passwordHash?: string | undefined;
  language?: Language | undefined;
  timezone?: Timezone | undefined;
  status?: UserStatus | undefined;
  roles: RoleName[];
}

export interface UserRepository {
  findByEmailForAuth(email: string): Promise<UserWithRoles | null>;
  /**
   * Pre-authorisation lookup by id for the token-refresh path, where the caller
   * proves identity with a valid refresh token but no tenant context exists yet.
   * Tenant-scoped reads must use {@link UserRepository.findById} instead.
   */
  findByIdForAuth(id: string): Promise<UserWithRoles | null>;
  findById(ctx: TenantContext, id: string): Promise<UserWithRoles | null>;
  listByTenant(ctx: TenantContext, page?: Pagination): Promise<UserWithRoles[]>;
  create(ctx: TenantContext, input: CreateUserInput): Promise<UserWithRoles>;
  updateLastLogin(id: string, at: Date): Promise<void>;
}

export function createUserRepository(db: UserDb): UserRepository {
  return {
    findByEmailForAuth(email) {
      // Pre-auth lookup: no tenant scope yet exists. Still excludes soft-deleted.
      return db.user.findFirst({
        where: { email: email.trim().toLowerCase(), deletedAt: null },
        include: withRoles,
      });
    },

    findByIdForAuth(id) {
      // Refresh path: identity is proven by the refresh token, not a session.
      return db.user.findFirst({
        where: { id, deletedAt: null },
        include: withRoles,
      });
    },

    findById(ctx, id) {
      return db.user.findFirst({
        where: { ...tenantScope(ctx), id },
        include: withRoles,
      });
    },

    listByTenant(ctx, page) {
      const { skip, take } = normalizePagination(page);
      return db.user.findMany({
        where: tenantScope(ctx),
        include: withRoles,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });
    },

    create(ctx, input) {
      const tenant = tenantScope(ctx);
      return db.user.create({
        data: {
          tenantId: tenant.tenantId,
          name: input.name,
          email: input.email.trim().toLowerCase(),
          phone: input.phone ?? null,
          passwordHash: input.passwordHash ?? null,
          language: input.language,
          timezone: input.timezone,
          status: input.status,
          createdBy: ctx.userId,
          userRoles: {
            create: input.roles.map((name) => ({
              role: { connect: { name } },
            })),
          },
        },
        include: withRoles,
      });
    },

    async updateLastLogin(id, at) {
      await db.user.update({
        where: { id },
        data: { lastLoginAt: at },
      });
    },
  };
}

/** Production instance bound to the shared Prisma singleton. */
export const userRepository = createUserRepository(prisma);
