/**
 * Public API of the drivers module (PRD 2. fejezet – Sofőr profil, 7. fejezet –
 * Drivers).
 *
 * Other modules import driver validation from here and never reach into the
 * module's internal files.
 */
export {
  DRIVER_STATUSES,
  driverStatusSchema,
  driverSchema,
  normalizeDriverCode,
  parseDriver,
  safeParseDriver,
  type DriverStatusValue,
  type DriverInput,
} from './driver-validation';
