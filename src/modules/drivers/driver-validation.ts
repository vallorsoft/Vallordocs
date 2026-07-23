import { z } from 'zod';

/**
 * Driver profile validation (PRD 2. fejezet – Sofőr profil, 4. fejezet –
 * Űrlapok/Validációk, 7. fejezet – Drivers).
 *
 * The backend layer of the mandatory three-layer validation. Every driver form
 * and Server Action validates against these schemas so the rules stay identical
 * across surfaces. All messages are translation keys, never raw strings.
 */

export const DRIVER_STATUSES = ['active', 'inactive', 'suspended'] as const;
export type DriverStatusValue = (typeof DRIVER_STATUSES)[number];

export const driverStatusSchema = z.enum(DRIVER_STATUSES);

/**
 * Canonical form of a driver code. The code identifies a driver within a tenant
 * and must be stable regardless of how it was typed, so we normalise by:
 *   1. trimming outer whitespace,
 *   2. upper-casing,
 *   3. removing *all* internal whitespace.
 *
 * Design choice: internal whitespace is stripped rather than collapsed to a dash
 * (e.g. `'ab 12'` → `'AB12'`, not `'AB-12'`). Codes come from external systems
 * where spaces are cosmetic; stripping keeps the identifier compact and avoids
 * inventing a separator that could collide with real, dash-bearing codes.
 */
export function normalizeDriverCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Driver code: alphanumeric plus dash, 2-32 chars, validated *after*
 * normalisation so the regex only ever sees the canonical form.
 */
const driverCodeSchema = z.preprocess(
  (value) => (typeof value === 'string' ? normalizeDriverCode(value) : value),
  z
    .string()
    .min(1, { message: 'validation.driverCodeRequired' })
    .regex(/^[A-Z0-9-]{2,32}$/, { message: 'validation.driverCode' }),
);

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{6,20}$/, { message: 'validation.phone' });

/** Fields captured when creating or editing a driver. */
export const driverSchema = z.object({
  name: z.string().trim().min(2, { message: 'validation.nameTooShort' }),
  driverCode: driverCodeSchema,
  phone: phoneSchema.optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'validation.email' })
    .optional(),
  licenseNumber: z.string().trim().min(1).optional(),
  adrCertified: z.boolean().default(false),
  status: driverStatusSchema.default('active'),
});

export type DriverInput = z.infer<typeof driverSchema>;

/** Parses and normalises a driver, throwing a ZodError on invalid input. */
export function parseDriver(input: unknown): DriverInput {
  return driverSchema.parse(input);
}

/** Safe variant that returns the discriminated Zod result instead of throwing. */
export function safeParseDriver(input: unknown) {
  return driverSchema.safeParse(input);
}
