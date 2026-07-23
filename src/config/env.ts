import { z } from 'zod';

/**
 * Central configuration module (PRD 6. fejezet – Konfiguráció).
 *
 * Every configuration value comes exclusively from environment variables.
 * Nothing is hardcoded. The schema is validated once at process start-up; if a
 * required variable is missing or malformed the application refuses to boot.
 *
 * Storage and AI providers are pluggable (Provider pattern). Provider-specific
 * secrets are only required when that provider is selected, so switching
 * providers is a matter of changing environment variables, never code.
 */

const nodeEnvSchema = z.enum(['development', 'test', 'production']);

const baseSchema = z.object({
  NODE_ENV: nodeEnvSchema.default('development'),

  APP_URL: z.string().url().default('http://localhost:3000'),

  // Localisation defaults (PRD 1. fejezet – Többnyelvű támogatás, Időzóna).
  DEFAULT_LANGUAGE: z.enum(['hu', 'ro']).default('hu'),
  DEFAULT_TIMEZONE: z
    .enum(['Europe/Budapest', 'Europe/Bucharest'])
    .default('Europe/Budapest'),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  // Data layer.
  DATABASE_URL: z.string().url(),

  // Queue / background processing (PRD 3. fejezet – Háttérfeldolgozás).
  REDIS_URL: z.string().url(),

  // Authentication secrets (PRD 2./5. fejezet – Munkamenet, Secret kezelés).
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // AI provider (PRD 3. fejezet – AI szolgáltató). Default provider is Gemini.
  AI_PROVIDER: z
    .enum(['gemini', 'openai', 'claude', 'vertexai'])
    .default('gemini'),
  GEMINI_API_KEY: z.string().optional(),

  // Storage provider selection (PRD 3. fejezet – Storage rendszer).
  STORAGE_PROVIDER: z.enum(['fly', 'r2', 's3', 'azure', 'gcs']).default('fly'),
  FLY_STORAGE_PATH: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY: z.string().optional(),
  R2_SECRET_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),

  // Outgoing mail (PRD 6. fejezet – Environment Variables).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
});

/**
 * Cross-field rules that enforce provider-specific requirements only for the
 * provider that is actually selected.
 */
const envSchema = baseSchema.superRefine((env, ctx) => {
  if (env.AI_PROVIDER === 'gemini' && !env.GEMINI_API_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['GEMINI_API_KEY'],
      message: 'GEMINI_API_KEY is required when AI_PROVIDER=gemini',
    });
  }

  if (env.STORAGE_PROVIDER === 'fly' && !env.FLY_STORAGE_PATH) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['FLY_STORAGE_PATH'],
      message: 'FLY_STORAGE_PATH is required when STORAGE_PROVIDER=fly',
    });
  }

  if (env.STORAGE_PROVIDER === 'r2') {
    const missing = (
      ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY', 'R2_SECRET_KEY', 'R2_BUCKET'] as const
    ).filter((key) => !env[key]);
    for (const key of missing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} is required when STORAGE_PROVIDER=r2`,
      });
    }
  }
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parses and validates a raw environment record. Exported separately from the
 * cached singleton so it can be unit tested with arbitrary inputs.
 */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues
      .map(
        (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
      )
      .join('\n');
    // Never leak values, only the names/reasons of the offending variables.
    throw new Error(
      `Invalid environment configuration. The application cannot start.\n${issues}`,
    );
  }

  return result.data;
}

let cachedEnv: Env | null = null;

/**
 * Returns the validated, cached environment. Call sites should use this rather
 * than reading from `process.env` directly so that validation is guaranteed.
 */
export function getEnv(): Env {
  if (cachedEnv === null) {
    cachedEnv = parseEnv(process.env);
  }
  return cachedEnv;
}

/** Test-only helper to reset the cache between cases. */
export function resetEnvCache(): void {
  cachedEnv = null;
}
