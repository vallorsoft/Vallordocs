'use client';

import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import { formatDate, formatDateTime } from '@/lib/datetime';
import { asLocale, asTimeZone } from '@/lib/format';
import { useSession } from '@/components/session-provider';

/**
 * Locale/timezone-aware formatters bound to the current user (PRD 1. fejezet –
 * Időzóna: a dátumok a felhasználó nyelvének és időzónájának megfelelően).
 *
 * The active UI locale comes from the route; the timezone comes from the loaded
 * profile, defaulting to the platform default until it arrives.
 */
export function useFormatting() {
  const uiLocale = useLocale();
  const { profile } = useSession();

  return useMemo(() => {
    const locale = asLocale(uiLocale);
    const timeZone = asTimeZone(profile?.timezone);
    return {
      locale,
      timeZone,
      dateTime: (value: string | Date) =>
        formatDateTime(value, { locale, timeZone }),
      date: (value: string | Date) => formatDate(value, { locale, timeZone }),
    };
  }, [uiLocale, profile?.timezone]);
}
