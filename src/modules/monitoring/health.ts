/**
 * Composable health-check aggregation (PRD 5. fejezet – Monitoring, Health
 * Check, Metrikák).
 *
 * This module only orchestrates injected probes: it runs them in parallel,
 * bounds each with a timeout, measures its duration, and folds the individual
 * results into one overall report. The probe implementations (the actual DB,
 * Redis, storage, … pings) live at the call site and are dependency-injected,
 * so this logic is pure orchestration and fully testable with fake probes.
 *
 * A failing probe must never leak internal error text, stack traces, file
 * paths or secrets to the client: any rejection or timeout collapses to a
 * generic, safe `detail`.
 */

/** Health status of a single probe or the aggregate report. */
export type HealthStatus = 'ok' | 'degraded' | 'down';

/** Well-known probe identifiers per PRD 5. fejezet. */
export const HEALTH_PROBE_NAMES = [
  'database',
  'redis',
  'storage',
  'gemini',
  'queue',
  'disk',
  'memory',
] as const;

export type HealthProbeName = (typeof HEALTH_PROBE_NAMES)[number];

/** Result a probe reports for itself. */
export interface HealthProbeResult {
  status: HealthStatus;
  /** Short, non-sensitive human-readable note. */
  detail?: string;
  /** Wall-clock time the probe took, filled in by the orchestrator. */
  durationMs?: number;
}

/** A named, injectable health probe. */
export interface HealthProbe {
  name: string;
  check: () => Promise<HealthProbeResult>;
}

/** The aggregate report returned by {@link runHealthChecks}. */
export interface HealthReport {
  status: HealthStatus;
  checks: Record<string, HealthProbeResult>;
  /** ISO-8601 timestamp of when the report was produced. */
  timestamp: string;
}

/** Options controlling aggregation. */
export interface RunHealthChecksOptions {
  /** Per-probe timeout in milliseconds. */
  timeoutMs: number;
  /** Injectable clock for deterministic duration/timestamp in tests. */
  now?: () => number;
}

/** Generic, safe detail emitted when a probe fails — never leaks internals. */
const SAFE_FAILURE_DETAIL = 'probe failed';
const SAFE_TIMEOUT_DETAIL = 'probe timed out';

const TIMED_OUT = Symbol('health-probe-timeout');

/**
 * Folds the individual probe statuses into the overall status: `down` if any
 * probe is down, else `degraded` if any is degraded, else `ok`.
 */
function foldStatus(results: readonly HealthProbeResult[]): HealthStatus {
  if (results.some((r) => r.status === 'down')) return 'down';
  if (results.some((r) => r.status === 'degraded')) return 'degraded';
  return 'ok';
}

async function runProbe(
  probe: HealthProbe,
  timeoutMs: number,
  now: () => number,
): Promise<HealthProbeResult> {
  const start = now();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs);
  });

  try {
    const outcome = await Promise.race([probe.check(), timeout]);
    const durationMs = now() - start;

    if (outcome === TIMED_OUT) {
      return { status: 'down', detail: SAFE_TIMEOUT_DETAIL, durationMs };
    }
    return { ...outcome, durationMs };
  } catch {
    // Deliberately swallow the error: its message/stack may contain secrets or
    // connection strings and must not reach the client.
    return {
      status: 'down',
      detail: SAFE_FAILURE_DETAIL,
      durationMs: now() - start,
    };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/**
 * Runs every probe in parallel under a per-probe timeout and returns the
 * aggregate {@link HealthReport}. A probe that rejects or exceeds `timeoutMs`
 * is reported as `down` with a safe generic detail.
 */
export async function runHealthChecks(
  probes: readonly HealthProbe[],
  options: RunHealthChecksOptions,
): Promise<HealthReport> {
  const now = options.now ?? Date.now;

  const settled = await Promise.all(
    probes.map(async (probe) => ({
      name: probe.name,
      result: await runProbe(probe, options.timeoutMs, now),
    })),
  );

  const checks: Record<string, HealthProbeResult> = {};
  for (const { name, result } of settled) {
    checks[name] = result;
  }

  return {
    status: foldStatus(settled.map((s) => s.result)),
    checks,
    timestamp: new Date(now()).toISOString(),
  };
}
