'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

/**
 * Light/dark mode toggle (PRD 4. fejezet – Színvilág: világos és sötét mód).
 *
 * The chosen theme is persisted to `localStorage` and applied by toggling the
 * `dark` class on `<html>` (Tailwind `darkMode: 'class'`). The initial class is
 * set by the inline no-flash script in the root layout; this control keeps that
 * in sync and lets the user switch at will.
 */
const STORAGE_KEY = 'vallordocs.theme';

function applyTheme(theme: 'light' | 'dark'): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeToggle() {
  const t = useTranslations('theme');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    );
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === 'dark' ? t('switchToLight') : t('switchToDark')}
      title={theme === 'dark' ? t('switchToLight') : t('switchToDark')}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  );
}

/**
 * Inline script string that applies the persisted (or system) theme before
 * first paint, preventing a flash of the wrong theme. Injected in the root
 * layout `<head>` via `dangerouslySetInnerHTML`.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;
