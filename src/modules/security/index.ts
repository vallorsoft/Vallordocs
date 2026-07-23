/**
 * Public API of the security module (PRD 5. fejezet – Rate Limit, OWASP,
 * Titkosítás, GDPR; 2. fejezet – Eszközkezelés).
 *
 * Other modules import rate limiting, User-Agent parsing and GDPR primitives
 * from here and never reach into the module's internal files.
 */
export {
  RATE_LIMIT_POLICIES,
  InMemoryRateLimiterStore,
  RateLimiter,
  type RateLimitAction,
  type RateLimitPolicy,
  type RateLimitEntry,
  type RateLimiterStore,
  type RateLimitResult,
  type RateLimitTarget,
} from './rate-limit';

export {
  parseUserAgent,
  type Device,
  type ParsedUserAgent,
} from './user-agent';

export {
  anonymizeUser,
  buildDataExport,
  retentionCutoff,
  expiredRecords,
  type PiiFields,
  type AnonymizableUser,
  type Retainable,
  type DataExportInput,
  type DataExport,
} from './gdpr';
