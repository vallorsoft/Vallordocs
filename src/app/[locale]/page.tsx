import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

/**
 * Foundation landing page. It only proves the i18n + design-system wiring; the
 * real Admin and Driver surfaces are built in later milestones.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations('home');

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
      <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
      <span className="rounded-full border border-border bg-secondary px-4 py-1 text-sm text-secondary-foreground">
        {t('status')}
      </span>
    </main>
  );
}
