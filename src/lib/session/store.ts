/**
 * Client session store (PRD 2. fejezet – Munkamenet; 4. fejezet – Nyelvváltás).
 *
 * A tiny framework-agnostic singleton that holds the authenticated session
 * (tokens + profile) in memory and mirrors it to `localStorage` so a reload keeps
 * the user signed in. It exposes a `useSyncExternalStore`-compatible
 * subscribe/getSnapshot pair for React and plain getters for the API client,
 * which must read the access token outside of the React tree.
 *
 * Note on the token model: the backend authenticates via a bearer access token
 * and rotates a refresh token; both are issued in the login response body. This
 * store is the single owner of that material on the client.
 */

/** The authenticated user projection returned by `/api/auth/login` and `/api/me`. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

/** The full persisted session: tokens plus the user profile. */
export interface Session {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

const STORAGE_KEY = 'vallordocs.session';

let current: Session | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

/** Reads and validates the persisted session shape, ignoring anything malformed. */
function readStorage(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (
      typeof parsed?.accessToken === 'string' &&
      typeof parsed?.refreshToken === 'string' &&
      typeof parsed?.user?.id === 'string' &&
      Array.isArray(parsed.user.permissions)
    ) {
      return parsed;
    }
  } catch {
    // Corrupt storage is treated as "signed out".
  }
  return null;
}

/** Hydrates from storage exactly once (lazy, on first access in the browser). */
function ensureHydrated(): void {
  if (hydrated) return;
  hydrated = true;
  current = readStorage();
}

function emit(): void {
  for (const listener of listeners) listener();
}

export const sessionStore = {
  /** Current session snapshot (stable reference between changes). */
  get(): Session | null {
    ensureHydrated();
    return current;
  },

  /** The current access token, or `null` when signed out. */
  getAccessToken(): string | null {
    return sessionStore.get()?.accessToken ?? null;
  },

  /** The current refresh token, or `null` when signed out. */
  getRefreshToken(): string | null {
    return sessionStore.get()?.refreshToken ?? null;
  },

  /** Replaces the session and persists it, notifying subscribers. */
  set(session: Session): void {
    ensureHydrated();
    current = session;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
    emit();
  },

  /**
   * Updates only the token pair (used after a silent refresh) while keeping the
   * cached user profile. A no-op when signed out.
   */
  updateTokens(tokens: { accessToken: string; refreshToken: string }): void {
    const existing = sessionStore.get();
    if (!existing) return;
    sessionStore.set({ ...existing, ...tokens });
  },

  /** Clears the session (sign out) and notifies subscribers. */
  clear(): void {
    ensureHydrated();
    current = null;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    emit();
  },

  /** Subscribes to session changes; returns an unsubscribe function. */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
