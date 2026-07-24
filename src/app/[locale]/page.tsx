'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { landingPath } from '@/lib/landing';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/session-provider';
import { LoadingState } from '@/components/data-state';

/**
 * Root entry point. Routes the visitor to their landing area once the session
 * store has hydrated: signed-in drivers to the PWA, other roles to the admin
 * console, and anonymous visitors to the login screen (PRD 4. fejezet – Driver
 * vs Admin felület).
 */
export default function HomePage() {
  const t = useTranslations('common');
  const { user, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(user ? landingPath(user.roles) : '/login');
  }, [ready, user, router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <span className="sr-only">{t('loading')}</span>
      <LoadingState />
    </main>
  );
}
