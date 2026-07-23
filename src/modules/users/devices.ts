/**
 * Device / session management (PRD 2. fejezet – Eszközkezelés).
 *
 * A user can be signed in from several devices at once; each active refresh
 * token is one session. This module is the pure logic behind the "active
 * devices" list and the "log out other devices" action. It operates on plain
 * {@link DeviceSession} values so it can be unit-tested without a database and
 * reused from Server Actions that load the sessions however they like.
 */

/** A single signed-in device, projected from a refresh token row. */
export interface DeviceSession {
  id: string;
  device: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  lastUsedAt: Date;
  createdAt: Date;
  /** True for the session issued to the request currently being served. */
  current: boolean;
  /** Non-null once the session has been revoked; such sessions are inactive. */
  revokedAt: Date | null;
}

/** Options for {@link selectSessionsToRevoke}. */
export interface RevokeOptions {
  /** When true, the current session is preserved (log out *other* devices). */
  keepCurrent: boolean;
}

/** Returns only the sessions that are still active (not yet revoked). */
export function activeSessions(sessions: DeviceSession[]): DeviceSession[] {
  return sessions.filter((session) => session.revokedAt === null);
}

/**
 * Returns the sessions sorted by last activity, most recently used first. Does
 * not mutate the input array.
 */
export function sortByLastUsed(sessions: DeviceSession[]): DeviceSession[] {
  return [...sessions].sort(
    (a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime(),
  );
}

/**
 * Computes the ids to revoke for a bulk "log out devices" action. Only active
 * sessions are considered, and when {@link RevokeOptions.keepCurrent} is set the
 * current session is never included so the acting device stays signed in.
 */
export function selectSessionsToRevoke(
  sessions: DeviceSession[],
  opts: RevokeOptions,
): string[] {
  return activeSessions(sessions)
    .filter((session) => !(opts.keepCurrent && session.current))
    .map((session) => session.id);
}

/**
 * Whether a single session may be revoked individually. The current session
 * cannot be revoked this way (a user logs *itself* out through sign-out, not the
 * device list), and an already-revoked session is a no-op.
 */
export function canRevokeSession(session: DeviceSession): boolean {
  return !session.current && session.revokedAt === null;
}
