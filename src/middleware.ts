import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * Locale negotiation middleware (PRD 1./4. fejezet – Nyelvváltás).
 *
 * Later milestones will compose authentication and tenant-resolution logic on
 * top of this middleware. For the foundation it only handles locale routing.
 */
export default createMiddleware(routing);

export const config = {
  // Skip Next.js internals, API routes and static assets.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
