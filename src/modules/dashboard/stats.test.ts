import { describe, expect, it } from 'vitest';
import {
  activeDrivers,
  aiSuccessRate,
  averageProcessingMs,
  buildDashboard,
  storageUsageMb,
  topDrivers,
  uploadsInRange,
  type DashboardDocRow,
  type DashboardJobRow,
} from './stats';

function doc(createdAt: string, driverId: string | null): DashboardDocRow {
  return { createdAt: new Date(createdAt), driverId };
}

describe('uploadsInRange', () => {
  const docs = [
    doc('2026-07-20T10:00:00Z', 'd1'),
    doc('2026-07-22T10:00:00Z', 'd2'),
    doc('2026-07-23T10:00:00Z', 'd3'),
  ];

  it('counts inclusively within the range', () => {
    expect(
      uploadsInRange(docs, {
        from: new Date('2026-07-22T00:00:00Z'),
        to: new Date('2026-07-23T23:59:59Z'),
      }),
    ).toBe(2);
  });

  it('returns 0 for empty inputs', () => {
    expect(
      uploadsInRange([], {
        from: new Date('2026-01-01'),
        to: new Date('2026-12-31'),
      }),
    ).toBe(0);
  });

  it('includes the exact boundary instants', () => {
    const from = new Date('2026-07-20T10:00:00Z');
    const to = new Date('2026-07-23T10:00:00Z');
    expect(uploadsInRange(docs, { from, to })).toBe(3);
  });
});

describe('aiSuccessRate', () => {
  it('returns 0 for no terminal jobs (divide-by-zero guard)', () => {
    expect(aiSuccessRate([])).toBe(0);
    expect(
      aiSuccessRate([{ status: 'queued' }, { status: 'processing' }]),
    ).toBe(0);
  });

  it('computes done / (done + failed) ignoring non-terminal', () => {
    const jobs: DashboardJobRow[] = [
      { status: 'done' },
      { status: 'done' },
      { status: 'failed' },
      { status: 'retrying' },
    ];
    expect(aiSuccessRate(jobs)).toBeCloseTo(2 / 3);
  });
});

describe('averageProcessingMs', () => {
  it('returns 0 when no durations present', () => {
    expect(averageProcessingMs([])).toBe(0);
    expect(averageProcessingMs([{ status: 'done', durationMs: null }])).toBe(0);
  });

  it('averages numeric durations and rounds, ignoring null', () => {
    const jobs: DashboardJobRow[] = [
      { status: 'done', durationMs: 100 },
      { status: 'done', durationMs: 201 },
      { status: 'failed', durationMs: null },
    ];
    expect(averageProcessingMs(jobs)).toBe(151);
  });
});

describe('topDrivers', () => {
  it('returns empty for no docs or non-positive limit', () => {
    expect(topDrivers([], 5)).toEqual([]);
    expect(topDrivers([doc('2026-07-01', 'd1')], 0)).toEqual([]);
  });

  it('counts per driver, ignores null, and is deterministic on ties', () => {
    const docs = [
      doc('2026-07-01', 'd1'),
      doc('2026-07-01', 'd1'),
      doc('2026-07-01', 'd3'),
      doc('2026-07-01', 'd2'),
      doc('2026-07-01', null),
    ];
    expect(topDrivers(docs, 2)).toEqual([
      { driverId: 'd1', count: 2 },
      { driverId: 'd2', count: 1 },
    ]);
  });
});

describe('activeDrivers', () => {
  it('counts distinct non-null drivers', () => {
    expect(
      activeDrivers([
        doc('2026-07-01', 'd1'),
        doc('2026-07-01', 'd1'),
        doc('2026-07-01', 'd2'),
        doc('2026-07-01', null),
      ]),
    ).toBe(2);
    expect(activeDrivers([])).toBe(0);
  });
});

describe('storageUsageMb', () => {
  it('sums bytes to MB rounded to 2 decimals', () => {
    expect(storageUsageMb([])).toBe(0);
    expect(storageUsageMb([{ sizeBytes: 1024 * 1024 }])).toBe(1);
    expect(
      storageUsageMb([{ sizeBytes: 1_572_864 }, { sizeBytes: 524_288 }]),
    ).toBe(2);
  });
});

describe('buildDashboard', () => {
  it('assembles a summary with today/week ranges', () => {
    const now = new Date('2026-07-23T12:00:00Z');
    const summary = buildDashboard({
      now,
      docs: [
        doc('2026-07-23T09:00:00Z', 'd1'),
        doc('2026-07-20T09:00:00Z', 'd1'),
        doc('2026-07-10T09:00:00Z', 'd2'),
      ],
      jobs: [
        { status: 'done', durationMs: 1000 },
        { status: 'failed', durationMs: 500 },
      ],
      files: [{ sizeBytes: 2 * 1024 * 1024 }],
      topDriverLimit: 5,
    });
    expect(summary.todayUploads).toBe(1);
    expect(summary.weekUploads).toBe(2);
    expect(summary.aiSuccessRate).toBeCloseTo(0.5);
    expect(summary.avgProcessingMs).toBe(750);
    expect(summary.storageUsageMb).toBe(2);
    expect(summary.activeDrivers).toBe(2);
    expect(summary.topDrivers[0]).toEqual({ driverId: 'd1', count: 2 });
  });

  it('handles fully empty inputs', () => {
    const summary = buildDashboard({
      now: new Date('2026-07-23T12:00:00Z'),
      docs: [],
      jobs: [],
      files: [],
    });
    expect(summary).toEqual({
      todayUploads: 0,
      weekUploads: 0,
      aiSuccessRate: 0,
      avgProcessingMs: 0,
      topDrivers: [],
      storageUsageMb: 0,
      activeDrivers: 0,
    });
  });
});
