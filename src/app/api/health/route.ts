import { NextResponse } from 'next/server';
import {
  runHealthChecks,
  type HealthProbe,
  type HealthReport,
} from '@/modules/monitoring';
import { prisma } from '@/lib/prisma';

/**
 * Liveness / readiness endpoint (PRD 5. fejezet – Health Check).
 *
 * The endpoint composes named probes through {@link runHealthChecks}. The
 * database probe issues a trivial `SELECT 1`; a failure or timeout folds into a
 * `degraded`/`down` overall status without leaking the underlying error text.
 * Storage remains a lightweight placeholder until its live probe lands.
 */
export const dynamic = 'force-dynamic';

/** Always-healthy probe factory used for the current placeholders. */
function okProbe(name: string): HealthProbe {
  return { name, check: () => Promise.resolve({ status: 'ok' as const }) };
}

/** Real database liveness probe: a trivial round-trip to Postgres. */
const databaseProbe: HealthProbe = {
  name: 'database',
  check: async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' as const };
  },
};

const PROBES: HealthProbe[] = [
  okProbe('app'),
  databaseProbe,
  okProbe('storage'),
];

export async function GET(): Promise<NextResponse<HealthReport>> {
  const report = await runHealthChecks(PROBES, { timeoutMs: 2000 });
  const httpStatus = report.status === 'down' ? 503 : 200;
  return NextResponse.json(report, { status: httpStatus });
}
