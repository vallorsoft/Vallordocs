/**
 * Public API of the tenants module (PRD 2. fejezet – Multi-Tenant architektúra).
 */
export {
  requireTenantId,
  tenantScope,
  assertSameTenant,
  isPlatformContext,
  type TenantContext,
} from './tenant-context';
