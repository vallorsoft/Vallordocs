import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vallordocs',
  description:
    'Multi-tenant document restoration platform for freight companies.',
  // PWA install metadata (PRD 4. fejezet – PWA követelmények: telepítés).
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vallordocs',
  },
};

/** Viewport-level theming for the installed PWA (Next 15 Viewport API). */
export const viewport: Viewport = {
  themeColor: '#0f172a',
};

/**
 * Statically render all supported locales.
 */
export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  // Enable static rendering for this locale.
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
