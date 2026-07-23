/**
 * Locale- and timezone-aware date/time formatting (PRD 1./4. fejezet –
 * Időzóna, Többnyelvű támogatás).
 *
 * Drivers and dispatchers operate across Hungary and Romania, so every rendered
 * timestamp must respect both the viewer's locale and their timezone. All
 * formatting goes through the platform `Intl` APIs — no hardcoded formats — so
 * the output is correct and consistent for `hu` and `ro` users in both the
 * `Europe/Budapest` and `Europe/Bucharest` zones.
 */

/** Timezones the platform supports (PRD 1. fejezet – Időzóna). */
export type SupportedTimeZone = 'Europe/Budapest' | 'Europe/Bucharest';

/** Locales the platform supports (PRD 1. fejezet – Többnyelvű támogatás). */
export type SupportedLocale = 'hu' | 'ro';

/** Options selecting the viewer's locale and timezone. */
export interface DateTimeFormatOptions {
  locale: SupportedLocale;
  timeZone: SupportedTimeZone;
}

/** Maps an app locale to its BCP-47 tag understood by `Intl`. */
const BCP47: Record<SupportedLocale, string> = {
  hu: 'hu-HU',
  ro: 'ro-RO',
};

/** Normalises the various inputs a caller may pass into a `Date`. */
function toDate(date: Date | number | string): Date {
  return date instanceof Date ? date : new Date(date);
}

/**
 * Formats a full date + time in the viewer's locale and timezone.
 * Uses explicit numeric fields so the layout is deterministic across engines.
 */
export function formatDateTime(
  date: Date | number | string,
  { locale, timeZone }: DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(BCP47[locale], {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(toDate(date));
}

/** Formats a date only (no time) in the viewer's locale and timezone. */
export function formatDate(
  date: Date | number | string,
  { locale, timeZone }: DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(BCP47[locale], {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(toDate(date));
}

/** Formats a time only (no date) in the viewer's locale and timezone. */
export function formatTime(
  date: Date | number | string,
  { locale, timeZone }: DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(BCP47[locale], {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(toDate(date));
}

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Formats the signed distance between `date` and `now` as a localized relative
 * phrase (e.g. "5 perce", "acum 5 minute"). Buckets by the coarsest applicable
 * unit: seconds under a minute, minutes under an hour, hours under a day, then
 * days. A past instant yields a negative value ("… ago"); a future one positive.
 */
export function relativeTime(
  date: Date | number | string,
  now: Date | number | string,
  locale: SupportedLocale,
): string {
  const diffMs = toDate(date).getTime() - toDate(now).getTime();
  const formatter = new Intl.RelativeTimeFormat(BCP47[locale], {
    numeric: 'auto',
  });

  const absMs = Math.abs(diffMs);
  if (absMs < MS_PER_MINUTE) {
    return formatter.format(Math.trunc(diffMs / MS_PER_SECOND), 'second');
  }
  if (absMs < MS_PER_HOUR) {
    return formatter.format(Math.trunc(diffMs / MS_PER_MINUTE), 'minute');
  }
  if (absMs < MS_PER_DAY) {
    return formatter.format(Math.trunc(diffMs / MS_PER_HOUR), 'hour');
  }
  return formatter.format(Math.trunc(diffMs / MS_PER_DAY), 'day');
}
