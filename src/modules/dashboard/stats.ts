/**
 * Dashboard aggregation over already-fetched rows (PRD 4. fejezet – Dashboard;
 * 5. fejezet – Metrikák).
 *
 * Pure functions only: every input is a plain array of rows the caller has
 * already loaded from the database. No Prisma, no I/O, no hidden clock — range
 * math takes an explicit `now`. This keeps the metrics deterministic and fully
 * unit-testable, and lets the data-access layer own all querying.
 */

/** A document row for upload/driver aggregation. */
export interface DashboardDocRow {
  createdAt: Date;
  driverId: string | null;
}

/** An AI job row for success-rate and duration aggregation. */
export interface DashboardJobRow {
  status: string;
  durationMs?: number | null;
}

/** A storage file row for usage aggregation. */
export interface DashboardFileRow {
  sizeBytes: number;
}

/** An inclusive time range. */
export interface DateRange {
  from: Date;
  to: Date;
}

/** A driver ranked by document count. */
export interface DriverCount {
  driverId: string;
  count: number;
}

/** Counts documents whose `createdAt` falls within `[from, to]` inclusive. */
export function uploadsInRange(
  docs: DashboardDocRow[],
  range: DateRange,
): number {
  const from = range.from.getTime();
  const to = range.to.getTime();
  return docs.reduce((count, doc) => {
    const t = doc.createdAt.getTime();
    return t >= from && t <= to ? count + 1 : count;
  }, 0);
}

/**
 * AI success rate as `done / (done + failed)` in `[0, 1]`. Only terminal
 * done/failed jobs count; other statuses are ignored. Returns 0 when there are
 * no terminal jobs (divide-by-zero guard).
 */
export function aiSuccessRate(jobs: DashboardJobRow[]): number {
  let done = 0;
  let failed = 0;
  for (const job of jobs) {
    if (job.status === 'done') done += 1;
    else if (job.status === 'failed') failed += 1;
  }
  const total = done + failed;
  return total === 0 ? 0 : done / total;
}

/**
 * Average processing time in milliseconds over jobs that report a numeric
 * `durationMs` (null/undefined are ignored). Rounded to an integer; 0 when no
 * job has a duration.
 */
export function averageProcessingMs(jobs: DashboardJobRow[]): number {
  let sum = 0;
  let n = 0;
  for (const job of jobs) {
    if (typeof job.durationMs === 'number' && Number.isFinite(job.durationMs)) {
      sum += job.durationMs;
      n += 1;
    }
  }
  return n === 0 ? 0 : Math.round(sum / n);
}

/**
 * Top `limit` drivers by document count. Documents without a `driverId` are
 * ignored. Ties are broken by `driverId` ascending for deterministic output.
 */
export function topDrivers(
  docs: DashboardDocRow[],
  limit: number,
): DriverCount[] {
  const counts = new Map<string, number>();
  for (const doc of docs) {
    if (doc.driverId === null) continue;
    counts.set(doc.driverId, (counts.get(doc.driverId) ?? 0) + 1);
  }
  const ranked = [...counts.entries()]
    .map(([driverId, count]) => ({ driverId, count }))
    .sort((a, b) =>
      b.count !== a.count
        ? b.count - a.count
        : a.driverId < b.driverId
          ? -1
          : a.driverId > b.driverId
            ? 1
            : 0,
    );
  return limit <= 0 ? [] : ranked.slice(0, limit);
}

/** Number of distinct drivers that own at least one document. */
export function activeDrivers(docs: DashboardDocRow[]): number {
  const ids = new Set<string>();
  for (const doc of docs) {
    if (doc.driverId !== null) ids.add(doc.driverId);
  }
  return ids.size;
}

/** Total storage usage in megabytes, rounded to 2 decimals. */
export function storageUsageMb(files: DashboardFileRow[]): number {
  const bytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

export interface BuildDashboardInput {
  docs: DashboardDocRow[];
  jobs: DashboardJobRow[];
  files: DashboardFileRow[];
  /** Reference instant for the today/week ranges. */
  now: Date;
  /** How many drivers to include in the leaderboard. Defaults to 5. */
  topDriverLimit?: number;
}

/** The assembled dashboard summary (PRD 4. fejezet – Dashboard). */
export interface DashboardSummary {
  todayUploads: number;
  weekUploads: number;
  aiSuccessRate: number;
  avgProcessingMs: number;
  topDrivers: DriverCount[];
  storageUsageMb: number;
  activeDrivers: number;
}

/** Milliseconds in one day. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Start of the UTC day containing `date`. */
function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

/**
 * Assembles a {@link DashboardSummary} from raw rows and a reference `now`.
 * "Today" is the UTC day containing `now`; "this week" is the trailing 7 days
 * ending at `now`.
 */
export function buildDashboard(input: BuildDashboardInput): DashboardSummary {
  const { docs, jobs, files, now, topDriverLimit = 5 } = input;

  const todayRange: DateRange = { from: startOfUtcDay(now), to: now };
  const weekRange: DateRange = {
    from: new Date(now.getTime() - 7 * DAY_MS),
    to: now,
  };

  return {
    todayUploads: uploadsInRange(docs, todayRange),
    weekUploads: uploadsInRange(docs, weekRange),
    aiSuccessRate: aiSuccessRate(jobs),
    avgProcessingMs: averageProcessingMs(jobs),
    topDrivers: topDrivers(docs, topDriverLimit),
    storageUsageMb: storageUsageMb(files),
    activeDrivers: activeDrivers(docs),
  };
}
