'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { RequireAuth } from '@/components/auth/require-auth';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';

/**
 * Admin application shell (PRD 4. fejezet – Admin felület, reszponzív működés).
 *
 * A persistent left rail on desktop collapses into an off-canvas drawer on
 * mobile. The whole area is gated by {@link RequireAuth}: unauthenticated users
 * are redirected to login before any admin data is requested.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <RequireAuth>
      <div className="flex min-h-screen">
        {/* Desktop rail */}
        <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
          <div className="flex h-16 items-center px-5 text-lg font-bold tracking-tight">
            {t('common.appName')}
          </div>
          <SidebarNav />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-background shadow-xl animate-in slide-in-from-left">
              <div className="flex h-16 items-center justify-between px-5">
                <span className="text-lg font-bold tracking-tight">
                  {t('common.appName')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerOpen(false)}
                  aria-label={t('common.cancel')}
                >
                  <X />
                </Button>
              </div>
              <SidebarNav onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setDrawerOpen(true)} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
