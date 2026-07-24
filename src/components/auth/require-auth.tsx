'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/session-provider';
import { LoadingState } from '@/components/data-state';
import { landingPath } from '@/lib/landing';

/**
 * Client-side route guard (PRD 2. fejezet – RBAC; 5. fejezet – Broken Access
 * Control). This is a UX gate only — every API it calls independently enforces
 * authentication and permissions server-side, which is the real boundary.
 *
 * Unauthenticated users are redirected to the login page. When `permission` is
 * given, a signed-in user lacking it is bounced to their own landing area rather
 * than shown a screen they cannot use.
 */
export function RequireAuth({
  children,
  permission,
}: {
  children: ReactNode;
  permission?: string;
}) {
  const { user, ready, can } = useSession();
  const router = useRouter();

  const authorized = user != null && (!permission || can(permission));

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace('/login');
    } else if (permission && !can(permission)) {
      router.replace(landingPath(user.roles));
    }
  }, [ready, user, permission, can, router]);

  if (!authorized) return <LoadingState />;
  return <>{children}</>;
}
