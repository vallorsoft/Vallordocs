import { ForbiddenError } from '@/shared/errors';
import type { RoleName } from '@prisma/client';

/**
 * Role-Based Access Control catalogue and enforcement (PRD 2. fejezet – RBAC).
 *
 * Permissions are dotted `resource.action` keys. Roles map to permission sets.
 * The design goal is extensibility: adding a role or permission is a data
 * change here, not a code change scattered across the app. Every backend
 * operation authorises against this catalogue - the frontend check alone is
 * never sufficient.
 */

export const PERMISSIONS = {
  DOCUMENT_READ: 'document.read',
  DOCUMENT_WRITE: 'document.write',
  DOCUMENT_DELETE: 'document.delete',
  TRIP_READ: 'trip.read',
  TRIP_WRITE: 'trip.write',
  DRIVER_READ: 'driver.read',
  DRIVER_WRITE: 'driver.write',
  USER_MANAGE: 'user.manage',
  TENANT_MANAGE: 'tenant.manage',
  PLATFORM_MANAGE: 'platform.manage',
  AI_EXECUTE: 'ai.execute',
  AUDIT_READ: 'audit.read',
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

/** Read-only variants of every resource permission. */
const READ_ONLY_PERMISSIONS: Permission[] = [
  PERMISSIONS.DOCUMENT_READ,
  PERMISSIONS.TRIP_READ,
  PERMISSIONS.DRIVER_READ,
  PERMISSIONS.AUDIT_READ,
];

const TENANT_ADMIN_PERMISSIONS: Permission[] = [
  PERMISSIONS.DOCUMENT_READ,
  PERMISSIONS.DOCUMENT_WRITE,
  PERMISSIONS.DOCUMENT_DELETE,
  PERMISSIONS.TRIP_READ,
  PERMISSIONS.TRIP_WRITE,
  PERMISSIONS.DRIVER_READ,
  PERMISSIONS.DRIVER_WRITE,
  PERMISSIONS.USER_MANAGE,
  PERMISSIONS.TENANT_MANAGE,
  PERMISSIONS.AI_EXECUTE,
  PERMISSIONS.AUDIT_READ,
  PERMISSIONS.SETTINGS_MANAGE,
];

const DISPATCHER_PERMISSIONS: Permission[] = [
  PERMISSIONS.DOCUMENT_READ,
  PERMISSIONS.DOCUMENT_WRITE,
  PERMISSIONS.TRIP_READ,
  PERMISSIONS.TRIP_WRITE,
  PERMISSIONS.DRIVER_READ,
  PERMISSIONS.DRIVER_WRITE,
  PERMISSIONS.AI_EXECUTE,
];

const OFFICE_USER_PERMISSIONS: Permission[] = [
  PERMISSIONS.DOCUMENT_READ,
  PERMISSIONS.TRIP_READ,
  PERMISSIONS.DRIVER_READ,
];

const DRIVER_PERMISSIONS: Permission[] = [
  PERMISSIONS.DOCUMENT_READ,
  PERMISSIONS.DOCUMENT_WRITE,
  PERMISSIONS.TRIP_READ,
];

/**
 * Static role → permission mapping. `platform_owner` has full access;
 * `platform_admin` manages the platform but is deliberately not granted the
 * platform's secret material at this layer (that is enforced elsewhere).
 */
export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  platform_owner: ALL_PERMISSIONS,
  platform_admin: [
    PERMISSIONS.PLATFORM_MANAGE,
    PERMISSIONS.TENANT_MANAGE,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.AUDIT_READ,
  ],
  tenant_admin: TENANT_ADMIN_PERMISSIONS,
  dispatcher: DISPATCHER_PERMISSIONS,
  office_user: OFFICE_USER_PERMISSIONS,
  driver: DRIVER_PERMISSIONS,
  read_only: READ_ONLY_PERMISSIONS,
};

/**
 * Resolves the effective, de-duplicated permission set for a list of roles.
 */
export function permissionsForRoles(roles: RoleName[]): Permission[] {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) {
      set.add(permission);
    }
  }
  return [...set];
}

/** A minimal principal carrying the permissions granted to the current caller. */
export interface Principal {
  permissions: string[];
}

/** Non-throwing authorisation check. */
export function can(principal: Principal, permission: Permission): boolean {
  return principal.permissions.includes(permission);
}

/** Returns true only when the principal holds every listed permission. */
export function canAll(
  principal: Principal,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => can(principal, permission));
}

/** Returns true when the principal holds at least one of the permissions. */
export function canAny(
  principal: Principal,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => can(principal, permission));
}

/**
 * Enforcing authorisation check. Throws {@link ForbiddenError} - which maps to a
 * safe, translated message - when the permission is missing.
 */
export function requirePermission(
  principal: Principal,
  permission: Permission,
): void {
  if (!can(principal, permission)) {
    throw new ForbiddenError({ requiredPermission: permission });
  }
}
