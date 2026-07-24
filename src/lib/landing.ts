/**
 * Post-login landing decision (PRD 4. fejezet – Driver vs Admin felület).
 *
 * Drivers land in the touch-first PWA; every other role lands in the admin
 * console. Kept pure so it is trivially unit-testable and reused by the login
 * flow and the root redirect alike.
 */
export type LandingArea = 'driver' | 'admin';

/**
 * A user who is *only* a driver goes to the driver PWA. Anyone holding an
 * office/dispatch/admin role goes to the admin console, even if they are also a
 * driver, because those roles imply back-office work.
 */
export function landingArea(roles: readonly string[]): LandingArea {
  const isDriver = roles.includes('driver');
  const hasOfficeRole = roles.some((role) => role !== 'driver');
  return isDriver && !hasOfficeRole ? 'driver' : 'admin';
}

/** The default route path (locale-agnostic) for a user's landing area. */
export function landingPath(roles: readonly string[]): string {
  return landingArea(roles) === 'driver' ? '/driver' : '/dashboard';
}
