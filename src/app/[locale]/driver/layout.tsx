import { setRequestLocale } from 'next-intl/server';
import { DriverShell } from '@/components/driver/driver-shell';

/**
 * Driver PWA layout. Enables static rendering for the locale, then renders the
 * touch-first {@link DriverShell}, which enforces authentication (PRD 4. fejezet
 * – Driver felület).
 */
export default async function DriverLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DriverShell>{children}</DriverShell>;
}
