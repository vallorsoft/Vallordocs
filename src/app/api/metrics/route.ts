import { NextResponse } from 'next/server';
import { route } from '@/lib/http';

/**
 * `GET /api/metrics` — Prometheus text exposition (PRD 5. fejezet – Monitoring,
 * Prometheus/Grafana).
 *
 * Exposes process-level gauges in the Prometheus text format (v0.0.4). This is
 * the scrape target a Prometheus server pulls; richer per-request counters plug
 * in here as they are introduced. The endpoint is intentionally dependency-free
 * so a scrape never fails because a downstream (DB/AI) is degraded — liveness of
 * dependencies is reported by `/api/health` instead.
 */
export const dynamic = 'force-dynamic';

/** One Prometheus sample: HELP + TYPE + value line. */
function metric(
  name: string,
  help: string,
  type: 'gauge' | 'counter',
  value: number,
): string {
  return `# HELP ${name} ${help}\n# TYPE ${name} ${type}\n${name} ${value}\n`;
}

export const GET = route(() => {
  const mem = process.memoryUsage();
  const body = [
    metric(
      'vallordocs_process_uptime_seconds',
      'Process uptime in seconds.',
      'gauge',
      Math.round(process.uptime()),
    ),
    metric(
      'vallordocs_process_resident_memory_bytes',
      'Resident set size in bytes.',
      'gauge',
      mem.rss,
    ),
    metric(
      'vallordocs_process_heap_used_bytes',
      'V8 heap used in bytes.',
      'gauge',
      mem.heapUsed,
    ),
    metric(
      'vallordocs_build_info',
      'Build info; always 1 (labels reserved for future use).',
      'gauge',
      1,
    ),
  ].join('');

  return new NextResponse(body, {
    status: 200,
    headers: { 'content-type': 'text/plain; version=0.0.4; charset=utf-8' },
  });
});
