import { describe, expect, it } from 'vitest';
import {
  normalizeDriverCode,
  parseDriver,
  safeParseDriver,
} from './driver-validation';

const valid = { name: 'Kovács János', driverCode: 'DR-001' };

describe('normalizeDriverCode', () => {
  it('trims, upper-cases and strips internal whitespace', () => {
    expect(normalizeDriverCode('  ab 12 ')).toBe('AB12');
    expect(normalizeDriverCode('dr-001')).toBe('DR-001');
  });
});

describe('driverSchema', () => {
  it('normalises the driver code before validating', () => {
    expect(parseDriver({ ...valid, driverCode: 'ab 12' }).driverCode).toBe(
      'AB12',
    );
  });

  it('defaults adrCertified to false and status to active', () => {
    const result = parseDriver(valid);
    expect(result.adrCertified).toBe(false);
    expect(result.status).toBe('active');
  });

  it('rejects a driver code with illegal characters', () => {
    const result = safeParseDriver({ ...valid, driverCode: 'a*b' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('validation.driverCode');
    }
  });

  it('rejects a too-short driver code', () => {
    expect(safeParseDriver({ ...valid, driverCode: 'a' }).success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = safeParseDriver({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('validation.email');
    }
  });

  it('accepts an optional valid email and lower-cases it', () => {
    expect(parseDriver({ ...valid, email: 'A@B.COM' }).email).toBe('a@b.com');
  });
});
