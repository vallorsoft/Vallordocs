/**
 * GDPR support primitives (PRD 5. fejezet – GDPR funkciók, Retention Policy,
 * Anonimizálás).
 *
 * These are pure, serialisable transforms: anonymisation for the Right to be
 * Forgotten, a data-portability export assembler, and retention-window math for
 * automatic archival/deletion. Persistence, scheduling and I/O live elsewhere;
 * this module only computes the shapes.
 */

/** Personally identifiable fields subject to anonymisation. */
export interface PiiFields {
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

/** Minimal user shape the anonymiser understands (id + PII + arbitrary rest). */
export type AnonymizableUser = PiiFields & { id: string };

/**
 * Returns a copy of `user` with every PII field replaced by a stable,
 * non-identifying placeholder derived from the immutable `id`. Non-PII and
 * audit fields are preserved untouched. The operation is idempotent: applying
 * it to an already-anonymised record yields an equal record.
 */
export function anonymizeUser<T extends AnonymizableUser>(user: T): T {
  return {
    ...user,
    name: 'Anonymized User',
    email: `anonymized+${user.id}@example.invalid`,
    phone: null,
    avatarUrl: null,
  };
}

/** Records that carry a creation timestamp for retention evaluation. */
export interface Retainable {
  createdAt: Date;
}

/**
 * The exclusive lower bound for retention: records created strictly before the
 * returned cutoff are eligible for archival/deletion.
 */
export function retentionCutoff(now: Date, retentionDays: number): Date {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

/**
 * Selects the records that have outlived the retention window (createdAt <
 * cutoff). Pure — it filters, it does not delete.
 */
export function expiredRecords<T extends Retainable>(
  records: readonly T[],
  now: Date,
  retentionDays: number,
): T[] {
  const cutoff = retentionCutoff(now, retentionDays).getTime();
  return records.filter((record) => record.createdAt.getTime() < cutoff);
}

/** Inputs assembled into a subject-access / portability export. */
export interface DataExportInput<
  U extends { id: string },
  D = unknown,
  T = unknown,
  A = unknown,
> {
  user: U;
  documents: readonly D[];
  trips: readonly T[];
  auditLogs: readonly A[];
}

/** The assembled, serialisable GDPR export document. */
export interface DataExport<
  U extends { id: string },
  D = unknown,
  T = unknown,
  A = unknown,
> {
  /** Data-subject identifier (the user id). */
  subject: string;
  /** ISO-8601 timestamp of when the export was produced. */
  exportedAt: string;
  user: U;
  documents: readonly D[];
  trips: readonly T[];
  auditLogs: readonly A[];
}

/**
 * Assembles a plain, serialisable data-portability export for one data subject
 * (GDPR Art. 20). `now` is injected so the `exportedAt` stamp is deterministic
 * in tests.
 */
export function buildDataExport<
  U extends { id: string },
  D = unknown,
  T = unknown,
  A = unknown,
>(
  input: DataExportInput<U, D, T, A>,
  now: Date = new Date(),
): DataExport<U, D, T, A> {
  return {
    subject: input.user.id,
    exportedAt: now.toISOString(),
    user: input.user,
    documents: input.documents,
    trips: input.trips,
    auditLogs: input.auditLogs,
  };
}
