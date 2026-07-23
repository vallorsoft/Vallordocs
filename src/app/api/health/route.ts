import { NextResponse } from 'next/server';
import {
  runHealthChecks,
  type HealthProbe,
  type HealthReport,
} from '@/modules/monitoring';

/**
 * Liveness / readiness endpoint (PRD 5. fejezet – Health Check).
 *
 * The endpoint composes named probes through {@link runHealthChecks}. In this
 * milestone the dependency probes (Database, Storage, …) are lightweight
 * placeholders that always report `ok` — the point here is the composable,
 * dependency-injected structure, not live connections that could fail the
 * build. Real probes replace these placeholders as those modules come online.
 */
export const dynamic = 'force-dynamic';

/** Always-healthy probe factory used for the current placeholders. */
function okProbe(name: string): HealthProbe {
  return { name, check: () => Promise.resolve({ status: 'ok' as const }) };
}

const PROBES: HealthProbe[] = [
  okProbe('app'),
  okProbe('database'),
  okProbe('storage'),
];

export async function GET(): Promise<NextResponse<HealthReport>> {
  const report = await runHealthChecks(PROBES, { timeoutMs: 2000 });
  const httpStatus = report.status === 'down' ? 503 : 200;
  return NextResponse.json(report, { status: httpStatus });
}
