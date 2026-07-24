import { setRequestLocale } from 'next-intl/server';
import { AppShell } from '@/components/layout/app-shell';

/**
 * Admin area layout. Enables static rendering for the locale, then hands off to
 * the client {@link AppShell}, which enforces authentication and renders the
 * navigation chrome (PRD 4. fejezet – Admin felület).
 */
export default async function AdminAreaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AppShell>{children}</AppShell>;
}
