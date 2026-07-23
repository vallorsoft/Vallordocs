import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

/**
 * Loads the message catalogue for the active request locale. All user-facing
 * text is served from the JSON catalogues under `/messages`; nothing is ever
 * hardcoded in components (PRD 1. fejezet – Fordítási fájlok).
 */
export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale: Locale = (
    routing.locales as readonly string[]
  ).includes(locale as string)
    ? (locale as Locale)
    : routing.defaultLocale;

  return {
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
  };
});
