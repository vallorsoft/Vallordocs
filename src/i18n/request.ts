import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

/**
 * Loads the message catalogue for the active request locale. All user-facing
 * text is served from the JSON catalogues under `/messages`; nothing is ever
 * hardcoded in components (PRD 1. fejezet – Fordítási fájlok).
 *
 * Uses the `requestLocale` API (next-intl ≥ 3.22) and returns both the resolved
 * `locale` and its `messages`, which is required for static rendering to resolve
 * translations in Server and Client Components alike.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = (routing.locales as readonly string[]).includes(
    requested as string,
  )
    ? (requested as Locale)
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
