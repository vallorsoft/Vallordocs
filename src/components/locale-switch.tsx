'use client';

import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Select } from '@/components/ui/select';

/**
 * Language switcher (PRD 1./4. fejezet – Nyelvváltás: HU/RO, új bejelentkezés
 * nélkül). Swaps the active locale in place by re-navigating to the same route
 * under the target locale, preserving any dynamic route params.
 */
const LABELS: Record<string, string> = {
  hu: 'Magyar',
  ro: 'Română',
};

export function LocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const change = (next: string) => {
    startTransition(() => {
      // `params` carries any dynamic segments so the equivalent path resolves.
      router.replace(
        // @ts-expect-error -- pathname is a known route; params satisfy it.
        { pathname, params },
        { locale: next },
      );
    });
  };

  return (
    <label className="inline-flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" aria-hidden />
      <span className="sr-only">Language</span>
      <Select
        value={locale}
        disabled={isPending}
        onChange={(event) => change(event.target.value)}
        className="h-9 w-auto"
      >
        {routing.locales.map((code) => (
          <option key={code} value={code}>
            {LABELS[code] ?? code}
          </option>
        ))}
      </Select>
    </label>
  );
}
