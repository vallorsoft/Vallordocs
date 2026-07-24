import { describe, expect, it } from 'vitest';
import {
  asLocale,
  asTimeZone,
  formatBytes,
  formatDuration,
  formatMegabytes,
  formatPercent,
} from './format';

describe('formatBytes', () => {
  it('renders zero and negatives as "0 B"', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-10)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
  });

  it('renders bytes without decimals and larger units with one', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1_572_864)).toBe('1.5 MB');
  });

  it('caps at terabytes', () => {
    expect(formatBytes(5 * 1024 ** 4)).toBe('5.0 TB');
  });
});

describe('formatMegabytes', () => {
  it('converts MB to a human-readable size', () => {
    expect(formatMegabytes(1)).toBe('1.0 MB');
    expect(formatMegabytes(1024)).toBe('1.0 GB');
    expect(formatMegabytes(0)).toBe('0 B');
  });
});

describe('formatDuration', () => {
  it('renders a dash for non-positive durations', () => {
    expect(formatDuration(0)).toBe('–');
    expect(formatDuration(-5)).toBe('–');
  });

  it('picks ms / s / min buckets', () => {
    expect(formatDuration(850)).toBe('850 ms');
    expect(formatDuration(1500)).toBe('1.5 s');
    expect(formatDuration(90_000)).toBe('1.5 min');
  });
});

describe('formatPercent', () => {
  it('rounds and clamps to [0, 1]', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(0.834)).toBe('83%');
    expect(formatPercent(1)).toBe('100%');
    expect(formatPercent(1.5)).toBe('100%');
    expect(formatPercent(-1)).toBe('0%');
  });
});

describe('asLocale', () => {
  it('maps ro to ro and everything else to hu', () => {
    expect(asLocale('ro')).toBe('ro');
    expect(asLocale('hu')).toBe('hu');
    expect(asLocale('en')).toBe('hu');
  });
});

describe('asTimeZone', () => {
  it('maps the Prisma enum and IANA forms, defaulting to Budapest', () => {
    expect(asTimeZone('Europe_Bucharest')).toBe('Europe/Bucharest');
    expect(asTimeZone('Europe/Bucharest')).toBe('Europe/Bucharest');
    expect(asTimeZone('Europe_Budapest')).toBe('Europe/Budapest');
    expect(asTimeZone(null)).toBe('Europe/Budapest');
    expect(asTimeZone(undefined)).toBe('Europe/Budapest');
  });
});
