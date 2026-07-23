import { z } from 'zod';

/**
 * User profile validation (PRD 2. fejezet – Felhasználó profil, 4. fejezet –
 * Űrlapok/Validációk, 7. fejezet – Users).
 *
 * Three-layer validation is mandatory (frontend, backend, database). This module
 * is the single source of truth for the backend layer: every user-facing form
 * and every Server Action validates against these schemas so that the rules can
 * never drift between surfaces. All messages are translation keys, never raw
 * strings (PRD 4. fejezet – Fordítás).
 */

export const SUPPORTED_LANGUAGES = ['hu', 'ro'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const SUPPORTED_TIMEZONES = [
  'Europe/Budapest',
  'Europe/Bucharest',
] as const;
export type SupportedTimezone = (typeof SUPPORTED_TIMEZONES)[number];

export const USER_STATUSES = [
  'active',
  'invited',
  'suspended',
  'disabled',
] as const;
export type UserStatusValue = (typeof USER_STATUSES)[number];

export const ROLE_NAMES = [
  'platform_owner',
  'platform_admin',
  'tenant_admin',
  'dispatcher',
  'office_user',
  'driver',
  'read_only',
] as const;
export type RoleNameValue = (typeof ROLE_NAMES)[number];

/**
 * Phone numbers are optional but, when present, must be a plausible E.164-ish
 * value. We deliberately keep this permissive: strict carrier validation belongs
 * to a later milestone and must not block legitimate freight contacts.
 */
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{6,20}$/, { message: 'validation.phone' });

export const languageSchema = z.enum(SUPPORTED_LANGUAGES);
export const timezoneSchema = z.enum(SUPPORTED_TIMEZONES);
export const userStatusSchema = z.enum(USER_STATUSES);
export const roleNameSchema = z.enum(ROLE_NAMES);

/** Fields a tenant admin sets when inviting or editing a user. */
export const userProfileSchema = z.object({
  name: z.string().trim().min(2, { message: 'validation.nameTooShort' }),
  email: z.string().trim().toLowerCase().email({ message: 'validation.email' }),
  phone: phoneSchema.optional(),
  language: languageSchema.default('hu'),
  timezone: timezoneSchema.default('Europe/Budapest'),
  status: userStatusSchema.default('invited'),
  roles: z
    .array(roleNameSchema)
    .min(1, { message: 'validation.rolesRequired' }),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;

/**
 * Self-service profile update. A user may change their own display fields and
 * localisation preferences, but never their roles or status - those are
 * privileged operations gated by RBAC on the server.
 */
export const selfProfileSchema = userProfileSchema.pick({
  name: true,
  phone: true,
  language: true,
  timezone: true,
});

export type SelfProfileInput = z.infer<typeof selfProfileSchema>;

/** Parses and normalises a user profile, throwing a ZodError on invalid input. */
export function parseUserProfile(input: unknown): UserProfileInput {
  return userProfileSchema.parse(input);
}

/** Safe variant that returns the discriminated Zod result instead of throwing. */
export function safeParseUserProfile(input: unknown) {
  return userProfileSchema.safeParse(input);
}
