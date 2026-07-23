import { describe, expect, it } from 'vitest';
import { ValidationError } from '@/shared/errors';
import {
  assertTransition,
  canTransition,
  TRIP_TRANSITIONS,
} from './trip-status';

describe('canTransition', () => {
  it('allows the forward lifecycle steps', () => {
    expect(canTransition('planned', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'completed')).toBe(true);
    expect(canTransition('planned', 'cancelled')).toBe(true);
    expect(canTransition('in_progress', 'cancelled')).toBe(true);
  });

  it('treats completed and cancelled as terminal', () => {
    expect(TRIP_TRANSITIONS.completed).toEqual([]);
    expect(TRIP_TRANSITIONS.cancelled).toEqual([]);
    expect(canTransition('completed', 'in_progress')).toBe(false);
    expect(canTransition('cancelled', 'planned')).toBe(false);
  });

  it('rejects illegal jumps', () => {
    expect(canTransition('planned', 'completed')).toBe(false);
  });
});

describe('assertTransition', () => {
  it('passes for a legal transition', () => {
    expect(() => assertTransition('planned', 'in_progress')).not.toThrow();
  });

  it('throws a ValidationError with the i18n key for an illegal one', () => {
    try {
      assertTransition('completed', 'planned');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).messageKey).toBe(
        'validation.invalidTripTransition',
      );
    }
  });
});
