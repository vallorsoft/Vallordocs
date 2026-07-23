import { describe, expect, it } from 'vitest';
import {
  runHealthChecks,
  type HealthProbe,
  type HealthProbeResult,
} from './health';

function probe(
  name: string,
  result: HealthProbeResult | (() => Promise<HealthProbeResult>),
): HealthProbe {
  return {
    name,
    check:
      typeof result === 'function' ? result : () => Promise.resolve(result),
  };
}

describe('runHealthChecks', () => {
  it('reports overall ok when every probe is ok', async () => {
    const report = await runHealthChecks(
      [probe('database', { status: 'ok' }), probe('storage', { status: 'ok' })],
      { timeoutMs: 100 },
    );
    expect(report.status).toBe('ok');
    expect(report.checks.database!.status).toBe('ok');
    expect(report.checks.storage!.status).toBe('ok');
    expect(typeof report.timestamp).toBe('string');
  });

  it('reports degraded when a probe is degraded but none are down', async () => {
    const report = await runHealthChecks(
      [
        probe('database', { status: 'ok' }),
        probe('redis', { status: 'degraded', detail: 'slow' }),
      ],
      { timeoutMs: 100 },
    );
    expect(report.status).toBe('degraded');
  });

  it('reports down when any probe is down', async () => {
    const report = await runHealthChecks(
      [
        probe('database', { status: 'ok' }),
        probe('redis', { status: 'degraded' }),
        probe('storage', { status: 'down' }),
      ],
      { timeoutMs: 100 },
    );
    expect(report.status).toBe('down');
  });

  it('marks a probe that exceeds the timeout as down', async () => {
    const clock = (() => {
      let t = 0;
      return {
        now: () => t,
        advance: (ms: number) => {
          t += ms;
        },
      };
    })();

    const report = await runHealthChecks(
      [
        probe(
          'gemini',
          () =>
            new Promise<HealthProbeResult>(() => {
              /* never resolves */
            }),
        ),
      ],
      { timeoutMs: 5, now: clock.now },
    );
    expect(report.checks.gemini!.status).toBe('down');
    expect(report.status).toBe('down');
  });

  it('does not leak internal error detail when a probe rejects', async () => {
    const secret = 'postgres://user:sup3rs3cret@db.internal:5432/app';
    const report = await runHealthChecks(
      [
        probe('database', () =>
          Promise.reject(new Error(`connection failed ${secret}`)),
        ),
      ],
      { timeoutMs: 100 },
    );
    expect(report.checks.database!.status).toBe('down');
    expect(report.checks.database!.detail).toBeDefined();
    expect(report.checks.database!.detail).not.toContain(secret);
    expect(report.checks.database!.detail).not.toContain('sup3rs3cret');
  });

  it('measures a durationMs for each probe', async () => {
    const report = await runHealthChecks([probe('memory', { status: 'ok' })], {
      timeoutMs: 100,
    });
    expect(typeof report.checks.memory!.durationMs).toBe('number');
    expect(report.checks.memory!.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('handles an empty probe list as ok', async () => {
    const report = await runHealthChecks([], { timeoutMs: 100 });
    expect(report.status).toBe('ok');
    expect(report.checks).toEqual({});
  });
});
