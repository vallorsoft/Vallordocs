'use client';

import { LogOut, Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/session-provider';
import { Button } from '@/components/ui/button';
import { LocaleSwitch } from '@/components/locale-switch';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Admin top bar (PRD 4. fejezet – Admin felület, Nyelvváltás, Színvilág).
 * Hosts the mobile menu trigger, the current user identity, the language and
 * theme controls, and sign-out.
 */
export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const t = useTranslations();
  const { user, logout } = useSession();
  const router = useRouter();

  async function onSignOut() {
    await logout();
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label={t('nav.dashboard')}
      >
        <Menu />
      </Button>

      <div className="min-w-0 flex-1">
        {user && (
          <div className="flex flex-col leading-tight">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        )}
      </div>

      <LocaleSwitch />
      <ThemeToggle />
      <Button
        variant="ghost"
        size="icon"
        onClick={onSignOut}
        aria-label={t('auth.signOut')}
        title={t('auth.signOut')}
      >
        <LogOut />
      </Button>
    </header>
  );
}
