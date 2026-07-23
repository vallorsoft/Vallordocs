import { ValidationError } from '@/shared/errors';
import { TRIP_STATUSES, type TripStatusValue } from './trip-validation';

/**
 * Trip status state machine (PRD 7. fejezet – Trips, TripStatus).
 *
 * A trip moves forward through its lifecycle; `completed` and `cancelled` are
 * terminal. Centralising the allowed transitions here keeps the rule in one
 * place so that no Server Action can silently perform an illegal jump.
 */
export const TRIP_TRANSITIONS: Record<TripStatusValue, TripStatusValue[]> = {
  planned: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/** Non-throwing check: whether `from` → `to` is a legal transition. */
export function canTransition(
  from: TripStatusValue,
  to: TripStatusValue,
): boolean {
  return TRIP_TRANSITIONS[from].includes(to);
}

/**
 * Enforcing variant. Throws {@link ValidationError} with the translated key
 * `validation.invalidTripTransition` when the transition is not allowed.
 */
export function assertTransition(
  from: TripStatusValue,
  to: TripStatusValue,
): void {
  if (!canTransition(from, to)) {
    throw new ValidationError({
      messageKey: 'validation.invalidTripTransition',
      context: { from, to, allowed: TRIP_TRANSITIONS[from] },
    });
  }
}

export { TRIP_STATUSES, type TripStatusValue };
