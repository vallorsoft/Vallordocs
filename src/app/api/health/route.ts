import { NextResponse } from 'next/server';

/**
 * Liveness / readiness endpoint (PRD 5. fejezet – Health Check).
 *
 * In this foundation milestone it reports process liveness and confirms that
 * the configuration module loaded successfully. Dependency probes (Database,
 * Redis, Storage, AI, Queue) are added as those modules come online.
 */
export const dynamic = 'force-dynamic';

export function GET(): NextResponse {
  return NextResponse.json({
    status: 'ok',
    service: 'vallordocs',
    timestamp: new Date().toISOString(),
    checks: {
      app: 'ok',
    },
  });
}
