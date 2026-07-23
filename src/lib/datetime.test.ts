import { describe, expect, it } from 'vitest';
import {
  formatDateTime,
  formatDate,
  formatTime,
  relativeTime,
} from './datetime';

// A fixed UTC instant: 2025-01-15 12:00:00 UTC (winter → CET/EET offsets).
// Budapest is UTC+1 → local hour 13; Bucharest is UTC+2 → local hour 14.
const INSTANT = new Date('2025-01-15T12:00:00Z');

describe('timezone awareness', () => {
  it('shifts the rendered hour between Budapest and Bucharest for one UTC instant', () => {
    const budapest = formatTime(INSTANT, {
      locale: 'hu',
      timeZone: 'Europe/Budapest',
    });
    const bucharest = formatTime(INSTANT, {
      locale: 'hu',
      timeZone: 'Europe/Bucharest',
    });

    expect(budapest).toContain('13');
    expect(bucharest).toContain('14');
    expect(budapest).not.toBe(bucharest);
  });

  it('reflects the timezone in the full date-time output', () => {
    const budapest = formatDateTime(INSTANT, {
      locale: 'hu',
      timeZone: 'Europe/Budapest',
    });
    const bucharest = formatDateTime(INSTANT, {
      locale: 'hu',
      timeZone: 'Europe/Bucharest',
    });

    expect(budapest).toContain('2025');
    expect(budapest).toContain('13');
    expect(bucharest).toContain('14');
    expect(budapest).not.toBe(bucharest);
  });
});

describe('locale awareness', () => {
  it('formats the same instant differently for hu vs ro', () => {
    const opts = { timeZone: 'Europe/Budapest' } as const;
    const hu = formatDate(INSTANT, { ...opts, locale: 'hu' });
    const ro = formatDate(INSTANT, { ...opts, locale: 'ro' });

    // Both contain the year, but Hungarian and Romanian order the fields
    // differently (hu: YYYY. MM. DD. vs ro: DD.MM.YYYY).
    expect(hu).toContain('2025');
    expect(ro).toContain('2025');
    expect(hu).not.toBe(ro);
  });
});

describe('formatTime', () => {
  it('renders a 24-hour time containing hour and minute', () => {
    const out = formatTime(INSTANT, {
      locale: 'hu',
      timeZone: 'Europe/Budapest',
    });
    expect(out).toContain('13');
    expect(out).toContain('00');
    expect(out.length).toBeGreaterThan(0);
  });

  it('accepts an epoch-millis number as well as a Date', () => {
    const fromNumber = formatTime(INSTANT.getTime(), {
      locale: 'hu',
      timeZone: 'Europe/Bucharest',
    });
    const fromDate = formatTime(INSTANT, {
      locale: 'hu',
      timeZone: 'Europe/Bucharest',
    });
    expect(fromNumber).toBe(fromDate);
  });
});

describe('relativeTime', () => {
  const NOW = new Date('2025-01-15T12:00:00Z');

  it('buckets a few seconds ago into seconds', () => {
    const out = relativeTime(new Date(NOW.getTime() - 5000), NOW, 'hu');
    expect(out).toContain('5');
    expect(out.length).toBeGreaterThan(0);
  });

  it('buckets minutes', () => {
    const out = relativeTime(new Date(NOW.getTime() - 5 * 60_000), NOW, 'hu');
    expect(out).toContain('5');
  });

  it('buckets hours', () => {
    const out = relativeTime(
      new Date(NOW.getTime() - 3 * 3_600_000),
      NOW,
      'ro',
    );
    expect(out).toContain('3');
  });

  it('buckets days', () => {
    // Use 5 days: unlike 1/2, larger day counts have no special word form in
    // hu/ro, so the numeric value is rendered.
    const out = relativeTime(
      new Date(NOW.getTime() - 5 * 86_400_000),
      NOW,
      'hu',
    );
    expect(out).toContain('5');
  });

  it('produces different phrasing for hu vs ro', () => {
    const past = new Date(NOW.getTime() - 5 * 60_000);
    expect(relativeTime(past, NOW, 'hu')).not.toBe(
      relativeTime(past, NOW, 'ro'),
    );
  });

  it('distinguishes past from future', () => {
    const past = relativeTime(
      new Date(NOW.getTime() - 3 * 3_600_000),
      NOW,
      'ro',
    );
    const future = relativeTime(
      new Date(NOW.getTime() + 3 * 3_600_000),
      NOW,
      'ro',
    );
    expect(past).not.toBe(future);
  });
});
