/**
 * Public API of the trips module (PRD 7. fejezet – Trips, TripStatus).
 *
 * Other modules import trip validation and the status state machine from here
 * and never reach into the module's internal files.
 */
export {
  TRIP_STATUSES,
  tripStatusSchema,
  tripSchema,
  parseTrip,
  safeParseTrip,
  type TripStatusValue,
  type TripInput,
} from './trip-validation';

export {
  TRIP_TRANSITIONS,
  canTransition,
  assertTransition,
} from './trip-status';
