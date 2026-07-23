/**
 * Public API of the dashboard module (PRD 4. fejezet – Dashboard; 5. fejezet –
 * Metrikák).
 */
export {
  uploadsInRange,
  aiSuccessRate,
  averageProcessingMs,
  topDrivers,
  activeDrivers,
  storageUsageMb,
  buildDashboard,
  type DashboardDocRow,
  type DashboardJobRow,
  type DashboardFileRow,
  type DateRange,
  type DriverCount,
  type BuildDashboardInput,
  type DashboardSummary,
} from './stats';
