'use client';

import { Camera, FileText, Home, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useSession } from '@/components/session-provider';
import { RequireAuth } from '@/components/auth/require-auth';
import { OfflineBanner } from '@/components/driver/offline-banner';
import { LocaleSwitch } from '@/components/locale-switch';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Driver PWA shell (PRD 4. fejezet – Driver felület: kevés kattintás, nagy
 * gombok, egyszerű navigáció). A touch-first frame: a compact top bar, an
 * offline banner, and a large-target bottom navigation. Gated by
 * {@link RequireAuth}.
 */
const NAV = [
  { href: '/driver', labelKey: 'driver.nav.home', icon: Home },
  { href: '/driver/capture', labelKey: 'driver.nav.capture', icon: Camera },
  {
    href: '/driver/documents',
    labelKey: 'driver.nav.documents',
    icon: FileText,
  },
];

export function DriverShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const { logout } = useSession();
  const router = useRouter();

  async function onSignOut() {
    await logout();
    router.replace('/login');
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-lg font-bold tracking-tight">
            {t('common.appName')}
          </span>
          <div className="flex items-center gap-1">
            <LocaleSwitch />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={onSignOut}
              aria-label={t('auth.signOut')}
            >
              <LogOut />
            </Button>
          </div>
        </header>

        <OfflineBanner />

        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-5 pb-24">
          {children}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background">
          <div className="mx-auto grid max-w-xl grid-cols-3">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </RequireAuth>
  );
}
