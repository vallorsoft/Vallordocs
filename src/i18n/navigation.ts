import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware navigation helpers. Components must use these instead of the
 * bare `next/link` / `next/navigation` primitives so that the active locale is
 * always preserved in URLs.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
