import { defineRouting } from 'next-intl/routing';

/**
 * i18n routing configuration (PRD 1./4. fejezet – Többnyelvű támogatás).
 *
 * The platform is bilingual from day one. Hungarian is the default locale;
 * Romanian is fully supported. New locales can be added here without touching
 * component code.
 */
export const routing = defineRouting({
  locales: ['hu', 'ro'],
  defaultLocale: 'hu',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];
