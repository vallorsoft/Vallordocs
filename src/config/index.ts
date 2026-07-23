/**
 * Public entry point of the configuration module.
 *
 * Other modules must import configuration from here and never read
 * `process.env` directly (PRD 6. fejezet – Konfiguráció).
 */
export { getEnv, parseEnv, resetEnvCache, type Env } from './env';
