/**
 * Append-only audit event construction (PRD 5. fejezet – Audit, Audit adatok,
 * Audit szabályok).
 *
 * Audit records are immutable: once written they are never updated or deleted by
 * the application. This module builds fully-populated, frozen audit entries from
 * an actor and an action, computes the minimal old/new delta so only what
 * changed is stored, and redacts secret material so credentials never enter the
 * audit trail (PRD 5. fejezet – Hibakezelés/Secret).
 *
 * The logic is pure and dependency-injected: no Prisma, no clock, no I/O. The
 * caller persists the returned {@link AuditEntry} into the immutable AuditLog
 * table.
 */

/**
 * Catalogue of auditable actions (PRD 5. fejezet – Audit adatok). Adding an
 * action is a data change here, not a scattered code change.
 */
export const AUDIT_ACTIONS = [
  'auth.login',
  'auth.logout',
  'auth.login_failed',
  'document.upload',
  'document.ai_process',
  'document.pdf_created',
  'user.create',
  'user.permission_change',
  'tenant.update',
  'storage.delete',
  'settings.update',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Default keys whose values must never be persisted into an audit entry. */
export const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'token',
  'tokenHash',
  'secret',
  'apiKey',
] as const;

/** Mask written in place of a redacted value. */
export const REDACTED_MASK = '[REDACTED]';

/**
 * Who performed the action and from where. `userId`/`tenantId` are null for
 * anonymous or platform-level events (e.g. a failed login before identity is
 * known).
 */
export interface AuditActor {
  userId: string | null;
  tenantId: string | null;
  ipAddress?: string;
  browser?: string;
  os?: string;
  device?: string;
}

/**
 * The immutable audit record shape, mirroring the AuditLog model. `id` and
 * `createdAt` are assigned when the row is built; the persisted row is never
 * mutated afterwards.
 */
export interface AuditEntry {
  id?: string;
  tenantId: string | null;
  userId: string | null;
  ipAddress: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  action: AuditAction;
  entity: string | null;
  entityId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  success: boolean;
  errorText: string | null;
  createdAt: Date;
}

/** The mutable details of an audited operation. */
export interface AuditDetails {
  entity?: string | null;
  entityId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  success?: boolean;
  errorText?: string | null;
}

export interface BuildAuditEntryParams {
  actor: AuditActor;
  action: AuditAction;
  details?: AuditDetails;
  /** Injectable clock for deterministic tests; defaults to now. */
  createdAt?: Date;
}

/**
 * Removes/masks sensitive keys from a shallow object before it enters the
 * `oldValue`/`newValue` columns, so the audit trail never stores secrets
 * (PRD 5. fejezet – Hibakezelés/Secret). Returns a new object; the input is not
 * mutated. `null`/`undefined` pass through unchanged.
 */
export function redactSensitive(
  obj: Record<string, unknown> | null | undefined,
  keys: readonly string[] = SENSITIVE_KEYS,
): Record<string, unknown> | null {
  if (obj === null || obj === undefined) return null;
  const sensitive = new Set(keys);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = sensitive.has(key) ? REDACTED_MASK : value;
  }
  return out;
}

/**
 * Computes the shallow delta between two objects, returning only the keys whose
 * values changed as `{ old, new }` pairs. Used so the audit log stores just the
 * change, not the whole record. Comparison is shallow: nested objects are
 * compared by reference/`Object.is`, so a nested change surfaces the whole
 * nested value as changed.
 */
export function diffValues(
  oldObj: Record<string, unknown> | null | undefined,
  newObj: Record<string, unknown> | null | undefined,
): Record<string, { old: unknown; new: unknown }> {
  const before = oldObj ?? {};
  const after = newObj ?? {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const delta: Record<string, { old: unknown; new: unknown }> = {};
  for (const key of keys) {
    const oldVal = before[key];
    const newVal = after[key];
    if (!Object.is(oldVal, newVal)) {
      delta[key] = { old: oldVal, new: newVal };
    }
  }
  return delta;
}

/**
 * Builds a fully-populated, frozen {@link AuditEntry} from an actor, an action
 * and the operation details. Secret material in `oldValue`/`newValue` is
 * redacted before it enters the record. `success` defaults to `true`;
 * `createdAt` is injectable and defaults to the current time. The returned
 * object is deep-frozen at the top level to enforce immutability.
 */
export function buildAuditEntry(params: BuildAuditEntryParams): AuditEntry {
  const { actor, action, details = {}, createdAt = new Date() } = params;

  const entry: AuditEntry = {
    tenantId: actor.tenantId,
    userId: actor.userId,
    ipAddress: actor.ipAddress ?? null,
    browser: actor.browser ?? null,
    os: actor.os ?? null,
    device: actor.device ?? null,
    action,
    entity: details.entity ?? null,
    entityId: details.entityId ?? null,
    oldValue: redactSensitive(details.oldValue),
    newValue: redactSensitive(details.newValue),
    success: details.success ?? true,
    errorText: details.errorText ?? null,
    createdAt,
  };

  return Object.freeze(entry);
}

/**
 * Development guard asserting that an entry is frozen (immutable). Throws if a
 * caller attempts to persist or forward an entry that could still be mutated,
 * catching accidental in-place edits of an audit record.
 */
export function assertAuditImmutable(entry: AuditEntry): void {
  if (!Object.isFrozen(entry)) {
    throw new Error('Audit entry must be immutable (frozen) before use');
  }
}
