'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useSession } from '@/components/session-provider';
import { ADMIN_NAV } from '@/components/layout/nav-items';
import { cn } from '@/lib/utils';

/**
 * Sidebar navigation list (PRD 4. fejezet – Admin menü). Renders only the items
 * the caller is permitted to see and highlights the active route. Shared by the
 * desktop rail and the mobile drawer; `onNavigate` lets the drawer close on tap.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();
  const { can } = useSession();

  const items = ADMIN_NAV.filter(
    (item) => item.permission === null || can(item.permission),
  );

  return (
    <nav className="flex flex-col gap-1 p-3" aria-label={t('nav.dashboard')}>
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
