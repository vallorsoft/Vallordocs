/**
 * Public API of the users module (PRD 2. fejezet – Felhasználó profil,
 * Eszközkezelés, 7. fejezet – Users).
 *
 * Other modules import user profile validation and device/session logic from
 * here and never reach into the module's internal files.
 */
export {
  SUPPORTED_LANGUAGES,
  SUPPORTED_TIMEZONES,
  USER_STATUSES,
  ROLE_NAMES,
  languageSchema,
  timezoneSchema,
  userStatusSchema,
  roleNameSchema,
  userProfileSchema,
  selfProfileSchema,
  parseUserProfile,
  safeParseUserProfile,
  type SupportedLanguage,
  type SupportedTimezone,
  type UserStatusValue,
  type RoleNameValue,
  type UserProfileInput,
  type SelfProfileInput,
} from './user-validation';

export {
  activeSessions,
  sortByLastUsed,
  selectSessionsToRevoke,
  canRevokeSession,
  type DeviceSession,
  type RevokeOptions,
} from './devices';
