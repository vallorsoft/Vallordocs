import { describe, expect, it } from 'vitest';
import { parseTrip, safeParseTrip } from './trip-validation';

describe('tripSchema', () => {
  it('defaults status to planned', () => {
    expect(parseTrip({ tripNumber: 'T-1' }).status).toBe('planned');
  });

  it('requires a trip number', () => {
    const result = safeParseTrip({ tripNumber: '  ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'validation.tripNumberRequired',
      );
    }
  });

  it('coerces date strings', () => {
    const result = parseTrip({
      tripNumber: 'T-1',
      departureAt: '2026-05-01T08:00:00Z',
      arrivalAt: '2026-05-01T18:00:00Z',
    });
    expect(result.departureAt).toBeInstanceOf(Date);
    expect(result.arrivalAt?.toISOString()).toBe('2026-05-01T18:00:00.000Z');
  });

  it('rejects an arrival before departure', () => {
    const result = safeParseTrip({
      tripNumber: 'T-1',
      departureAt: '2026-05-02T08:00:00Z',
      arrivalAt: '2026-05-01T08:00:00Z',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'validation.arrivalBeforeDeparture',
      );
      expect(result.error.issues[0]?.path).toEqual(['arrivalAt']);
    }
  });

  it('allows equal departure and arrival', () => {
    expect(
      safeParseTrip({
        tripNumber: 'T-1',
        departureAt: '2026-05-01T08:00:00Z',
        arrivalAt: '2026-05-01T08:00:00Z',
      }).success,
    ).toBe(true);
  });

  it('allows one date without the other', () => {
    expect(
      safeParseTrip({ tripNumber: 'T-1', arrivalAt: '2026-05-01T08:00:00Z' })
        .success,
    ).toBe(true);
  });
});
