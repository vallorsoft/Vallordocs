/**
 * Client-side API DTOs (PRD 4. fejezet – Admin/Driver felület adatai).
 *
 * These mirror the JSON the route handlers return. Prisma `DateTime` fields are
 * serialised to ISO strings over the wire, so every timestamp is typed as
 * `string` here and formatted through the datetime/format helpers on render.
 */

export interface DocumentDto {
  id: string;
  tenantId: string;
  tripId: string | null;
  driverId: string | null;
  documentType: string;
  status: string;
  aiStatus: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface TripDto {
  id: string;
  tenantId: string;
  tripNumber: string;
  orderNumber: string | null;
  originPlace: string | null;
  destination: string | null;
  departureAt: string | null;
  arrivalAt: string | null;
  status: string;
  driverId: string | null;
  createdAt: string;
}

export interface DriverDto {
  id: string;
  tenantId: string;
  name: string;
  driverCode: string;
  phone: string | null;
  email: string | null;
  licenseNumber: string | null;
  adrCertified: boolean;
  status: string;
  createdAt: string;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  status: string;
  roles: string[];
}

export interface AiJobDto {
  id: string;
  documentId: string;
  status: string;
  provider: string;
  model: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  tokensUsed: number | null;
  errorMessage: string | null;
  attempts: number;
  createdAt: string;
}

export interface AuditEntryDto {
  id: string;
  userId: string | null;
  ipAddress: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  success: boolean;
  errorText: string | null;
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  readAt: string | null;
  createdAt: string;
}

export interface DashboardSummaryDto {
  todayUploads: number;
  weekUploads: number;
  aiSuccessRate: number;
  avgProcessingMs: number;
  topDrivers: Array<{ driverId: string; count: number }>;
  storageUsageMb: number;
  activeDrivers: number;
}

export interface MeDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  language: string;
  timezone: string;
  status: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

export interface TenantSettingsDto {
  defaultLanguage: string;
  defaultTimezone: string;
  aiEnabled: boolean;
  pdfQuality: string;
  storageLimitMb?: number;
  documentRetentionDays: number;
  auditRetentionDays: number;
  logRetentionDays: number;
}

export interface PlatformTenantDto {
  id: string;
  companyName: string;
  country: string | null;
  isActive: boolean;
  createdAt: string;
  userCount: number;
  documentCount: number;
  driverCount: number;
}

export interface PlatformOverviewDto {
  totals: {
    tenants: number;
    activeTenants: number;
    users: number;
    documents: number;
    drivers: number;
    trips: number;
  };
  tenants: PlatformTenantDto[];
}

/** Response envelopes keyed by their single payload property. */
export interface DocumentsResponse {
  documents: DocumentDto[];
}
export interface TripsResponse {
  trips: TripDto[];
}
export interface DriversResponse {
  drivers: DriverDto[];
}
export interface UsersResponse {
  users: UserDto[];
}
export interface AiJobsResponse {
  jobs: AiJobDto[];
}
export interface AuditResponse {
  entries: AuditEntryDto[];
}
export interface NotificationsResponse {
  notifications: NotificationDto[];
}
export interface DashboardResponse {
  dashboard: DashboardSummaryDto;
}
export interface SettingsResponse {
  settings: TenantSettingsDto;
}
export interface SuperadminOverviewResponse {
  overview: PlatformOverviewDto;
}
