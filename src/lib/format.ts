/**
 * Presentation-layer formatting helpers (PRD 4. fejezet – Felhasználói élmény,
 * Metrikák). Pure and unit-tested. Locale/timezone-aware date formatting lives in
 * {@link ./datetime}; this module only owns the numeric/byte formatters and the
 * small adapters the UI needs on top of it.
 */
import type { SupportedTimeZone, SupportedLocale } from './datetime';

/** Human-readable byte size, e.g. `1.5 MB`. Non-positive inputs render as `0 B`. */
export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** exponent;
  const digits = exponent === 0 ? 0 : fractionDigits;
  return `${value.toFixed(digits)} ${units[exponent]}`;
}

/** Megabytes → human-readable size. The dashboard reports storage usage in MB. */
export function formatMegabytes(mb: number): string {
  return formatBytes(Math.max(0, mb) * 1024 * 1024);
}

/**
 * A duration in milliseconds as a compact `1.2 s` / `850 ms` / `2.5 min` string.
 * Non-finite or non-positive values render as `–`.
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '–';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  return `${(seconds / 60).toFixed(1)} min`;
}

/** A ratio in `[0, 1]` as a whole-number percentage, e.g. `0.83` → `83%`. */
export function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return '0%';
  const clamped = Math.min(1, Math.max(0, ratio));
  return `${Math.round(clamped * 100)}%`;
}

/**
 * Narrows an app locale string to the {@link SupportedLocale} union, falling back
 * to Hungarian (the platform default) for anything unexpected.
 */
export function asLocale(locale: string): SupportedLocale {
  return locale === 'ro' ? 'ro' : 'hu';
}

/**
 * Converts a Prisma `Timezone` enum member (`Europe_Budapest`) to the IANA form
 * (`Europe/Budapest`) that `Intl` and {@link ./datetime} expect. Unknown values
 * fall back to `Europe/Budapest`.
 */
export function asTimeZone(
  timezone: string | null | undefined,
): SupportedTimeZone {
  return timezone === 'Europe_Bucharest' || timezone === 'Europe/Bucharest'
    ? 'Europe/Bucharest'
    : 'Europe/Budapest';
}
