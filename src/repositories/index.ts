/**
 * Public API of the repository layer (PRD 7. fejezet – Adatelérési réteg).
 *
 * Repositories are the only layer that touches Prisma directly. Route handlers
 * and modules import repository *instances* (or the factories, for testing) from
 * here and never reach into individual files or `@/lib/prisma`.
 *
 * Tenant isolation is non-negotiable: every tenant-scoped query in these
 * repositories applies `tenantScope(ctx)` so a query can never cross a tenant.
 */
export {
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
  normalizePagination,
  type Db,
  type Pagination,
} from './types';

export {
  userRepository,
  createUserRepository,
  type UserRepository,
  type UserWithRoles,
  type CreateUserInput,
} from './userRepository';

export {
  tenantRepository,
  createTenantRepository,
  type TenantRepository,
} from './tenantRepository';

export {
  driverRepository,
  createDriverRepository,
  type DriverRepository,
} from './driverRepository';

export {
  tripRepository,
  createTripRepository,
  type TripRepository,
} from './tripRepository';

export {
  documentRepository,
  createDocumentRepository,
  type DocumentRepository,
  type CreateDocumentInput,
} from './documentRepository';

export {
  aiJobRepository,
  createAiJobRepository,
  type AiJobRepository,
  type EnqueueAiJobInput,
} from './aiJobRepository';

export {
  auditRepository,
  createAuditRepository,
  type AuditRepository,
} from './auditRepository';

export {
  notificationRepository,
  createNotificationRepository,
  type NotificationRepository,
  type CreateNotificationInput,
} from './notificationRepository';

export {
  settingRepository,
  createSettingRepository,
  type SettingRepository,
} from './settingRepository';

export {
  refreshTokenRepository,
  createRefreshTokenRepository,
  type RefreshTokenRepository,
  type CreateRefreshTokenInput,
} from './refreshTokenRepository';

export {
  loginHistoryRepository,
  createLoginHistoryRepository,
  type LoginHistoryRepository,
  type RecordLoginInput,
} from './loginHistoryRepository';

export {
  dashboardRepository,
  createDashboardRepository,
  type DashboardRepository,
  type DashboardRows,
} from './dashboardRepository';
