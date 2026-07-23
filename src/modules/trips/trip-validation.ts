import { z } from 'zod';

/**
 * Trip validation (PRD 4. fejezet – Űrlapok/Validációk, 7. fejezet – Trips).
 *
 * The backend layer of the mandatory three-layer validation for trips. Every
 * trip form and Server Action validates against these schemas. All messages are
 * translation keys, never raw strings.
 */

export const TRIP_STATUSES = [
  'planned',
  'in_progress',
  'completed',
  'cancelled',
] as const;
export type TripStatusValue = (typeof TRIP_STATUSES)[number];

export const tripStatusSchema = z.enum(TRIP_STATUSES);

/** Fields captured when creating or editing a trip. */
export const tripSchema = z
  .object({
    tripNumber: z
      .string()
      .trim()
      .min(1, { message: 'validation.tripNumberRequired' }),
    orderNumber: z.string().trim().min(1).optional(),
    originPlace: z.string().trim().min(1).optional(),
    destination: z.string().trim().min(1).optional(),
    departureAt: z.coerce.date().optional(),
    arrivalAt: z.coerce.date().optional(),
    status: tripStatusSchema.default('planned'),
  })
  .refine(
    (trip) =>
      !trip.departureAt ||
      !trip.arrivalAt ||
      trip.arrivalAt.getTime() >= trip.departureAt.getTime(),
    { path: ['arrivalAt'], message: 'validation.arrivalBeforeDeparture' },
  );

export type TripInput = z.infer<typeof tripSchema>;

/** Parses a trip, throwing a ZodError on invalid input. */
export function parseTrip(input: unknown): TripInput {
  return tripSchema.parse(input);
}

/** Safe variant that returns the discriminated Zod result instead of throwing. */
export function safeParseTrip(input: unknown) {
  return tripSchema.safeParse(input);
}
