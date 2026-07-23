/**
 * Public API of the audit module (PRD 5. fejezet – Audit).
 *
 * Other modules construct immutable audit entries through here and never reach
 * into the module's internal files.
 */
export {
  AUDIT_ACTIONS,
  SENSITIVE_KEYS,
  REDACTED_MASK,
  buildAuditEntry,
  diffValues,
  redactSensitive,
  assertAuditImmutable,
  type AuditAction,
  type AuditActor,
  type AuditEntry,
  type AuditDetails,
  type BuildAuditEntryParams,
} from './audit';
