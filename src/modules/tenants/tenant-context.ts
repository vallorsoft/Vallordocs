import { ForbiddenError } from '@/shared/errors';
import type { Permission, Principal } from '@/modules/auth';
import type { RoleName } from '@prisma/client';

/**
 * Tenant context and isolation guards (PRD 2. fejezet – Multi-Tenant, 7. fejezet
 * – Közös mezők).
 *
 * Tenant isolation is the primary, non-negotiable security requirement: no
 * query may ever return another tenant's data. This module provides the request
 * context that every tenant-scoped operation carries, plus helpers that build
 * the mandatory `tenantId` filter and assert ownership of a loaded record.
 */

export interface TenantContext extends Principal {
  userId: string;
  /**
   * The tenant the request is scoped to. Platform-level operators act without a
   * tenant; tenant-scoped operations must reject a null tenant.
   */
  tenantId: string | null;
  roles: RoleName[];
  permissions: Permission[];
}

/**
 * Returns a context's tenant id, throwing when the caller is not scoped to a
 * tenant. Use before any tenant-scoped data access.
 */
export function requireTenantId(context: TenantContext): string {
  if (!context.tenantId) {
    throw new ForbiddenError({ reason: 'operation requires a tenant scope' });
  }
  return context.tenantId;
}

/**
 * Builds the mandatory Prisma `where` fragment for a tenant-scoped query. By
 * default it also excludes soft-deleted rows. Spread it into every query so
 * that tenant filtering can never be forgotten:
 *
 *   prisma.document.findMany({ where: { ...tenantScope(ctx), status } })
 */
export function tenantScope(
  context: TenantContext,
  options: { includeDeleted?: boolean } = {},
): { tenantId: string; deletedAt?: null } {
  const tenantId = requireTenantId(context);
  return options.includeDeleted ? { tenantId } : { tenantId, deletedAt: null };
}

/**
 * Asserts that a loaded record belongs to the caller's tenant. Guards against
 * IDOR: even if a record was fetched by id, cross-tenant access is refused.
 * Platform operators (null tenant) bypass this check by design.
 */
export function assertSameTenant(
  context: TenantContext,
  resource: { tenantId: string | null },
): void {
  if (context.tenantId === null) return; // platform-level access
  if (resource.tenantId !== context.tenantId) {
    throw new ForbiddenError({ reason: 'cross-tenant access denied' });
  }
}

/** True when the caller operates at the platform level (no tenant scope). */
export function isPlatformContext(context: TenantContext): boolean {
  return context.tenantId === null;
}
