import { z } from 'zod';

/**
 * Tenant settings validation with safe defaults (PRD 2. fejezet – Tenant
 * beállítások; 5. fejezet – Retention Policy; 7. fejezet – Settings).
 *
 * Settings are the single source of truth for a tenant's localisation, AI and
 * retention preferences. They are persisted as key/value rows (Setting model),
 * so this module also converts between the typed settings object and the row
 * representation, always falling back to defaults for missing or unknown keys.
 * Validation messages are translation keys, never raw strings.
 */

export const SETTINGS_LANGUAGES = ['hu', 'ro'] as const;
export type SettingsLanguage = (typeof SETTINGS_LANGUAGES)[number];

export const SETTINGS_TIMEZONES = [
  'Europe/Budapest',
  'Europe/Bucharest',
] as const;
export type SettingsTimezone = (typeof SETTINGS_TIMEZONES)[number];

export const PDF_QUALITIES = ['standard', 'high'] as const;
export type PdfQuality = (typeof PDF_QUALITIES)[number];

/**
 * Tenant settings schema. Note the zod (^3.24) caveat: `z.enum(VALUES)` takes no
 * options object; only `.min()`/`.default()` accept `{ message }`.
 */
export const tenantSettingsSchema = z.object({
  defaultLanguage: z.enum(SETTINGS_LANGUAGES).default('hu'),
  defaultTimezone: z.enum(SETTINGS_TIMEZONES).default('Europe/Budapest'),
  aiEnabled: z.boolean().default(true),
  pdfQuality: z.enum(PDF_QUALITIES).default('high'),
  storageLimitMb: z
    .number()
    .int({ message: 'validation.integer' })
    .positive({ message: 'validation.positive' })
    .optional(),
  documentRetentionDays: z
    .number()
    .int({ message: 'validation.integer' })
    .min(1, { message: 'validation.min' })
    .default(3650),
  auditRetentionDays: z
    .number()
    .int({ message: 'validation.integer' })
    .min(1, { message: 'validation.min' })
    .default(3650),
  logRetentionDays: z
    .number()
    .int({ message: 'validation.integer' })
    .min(1, { message: 'validation.min' })
    .default(365),
});

export type TenantSettings = z.infer<typeof tenantSettingsSchema>;

/** Fully-defaulted settings, used when a tenant has stored nothing. */
export const DEFAULT_TENANT_SETTINGS: TenantSettings =
  tenantSettingsSchema.parse({});

/**
 * Parses and validates settings input, merging with defaults for any omitted
 * field. Throws a ZodError on invalid input.
 */
export function parseTenantSettings(input: unknown): TenantSettings {
  return tenantSettingsSchema.parse(input ?? {});
}

/** Safe variant returning the discriminated Zod result instead of throwing. */
export function safeParseTenantSettings(input: unknown) {
  return tenantSettingsSchema.safeParse(input ?? {});
}

/** A persisted key/value settings row (Setting model). */
export interface SettingRow {
  key: string;
  value: unknown;
}

/**
 * Serialises a settings object into key/value rows for the Setting table.
 * Optional fields that are absent (e.g. `storageLimitMb`) are omitted.
 */
export function toSettingRows(settings: TenantSettings): SettingRow[] {
  return Object.entries(settings)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ({ key, value }));
}

/**
 * Rebuilds a validated settings object from key/value rows. Unknown keys are
 * ignored and missing keys fall back to defaults. Throws a ZodError only if a
 * known key holds an invalid value.
 */
export function fromSettingRows(rows: SettingRow[]): TenantSettings {
  const known = new Set<string>(Object.keys(tenantSettingsSchema.shape));
  const input: Record<string, unknown> = {};
  for (const { key, value } of rows) {
    if (known.has(key)) input[key] = value;
  }
  return tenantSettingsSchema.parse(input);
}
