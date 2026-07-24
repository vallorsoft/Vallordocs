'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { apiFetch } from '@/lib/api/client';
import type { MeDto } from '@/lib/api/types';
import {
  sessionStore,
  type Session,
  type SessionUser,
} from '@/lib/session/store';

/**
 * Session context (PRD 2. fejezet – Hitelesítés, Munkamenet).
 *
 * Exposes the reactive authenticated session to the component tree and the
 * imperative `login`/`logout` actions. State is backed by {@link sessionStore}
 * via `useSyncExternalStore`, so any part of the app — and the non-React API
 * client — observes a single source of truth.
 */
interface SessionContextValue {
  session: Session | null;
  user: SessionUser | null;
  /** Full profile (language, timezone, phone) loaded from `/api/me`, if ready. */
  profile: MeDto | null;
  /** True once the store has hydrated from storage on the client. */
  ready: boolean;
  /** Non-throwing permission check against the RBAC catalogue keys. */
  can: (permission: string) => boolean;
  /** Authenticates and stores the session. Throws {@link ApiError} on failure. */
  login: (email: string, password: string) => Promise<void>;
  /** Clears the session locally and best-effort revokes it server-side. */
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Server snapshot: always signed out until the client hydrates. */
function getServerSnapshot(): Session | null {
  return null;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.get,
    getServerSnapshot,
  );

  // Load the richer profile (language/timezone) once per authenticated session;
  // it powers locale/timezone-aware date rendering across the app.
  const [profile, setProfile] = useState<MeDto | null>(null);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    apiFetch<MeDto>('/api/me')
      .then((me) => {
        if (!cancelled) setProfile(me);
      })
      .catch(() => {
        // Non-fatal: date rendering falls back to platform defaults.
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      json: { email, password },
    });
    sessionStore.set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = sessionStore.getRefreshToken();
    // Revoke server-side first, while the access token is still attached; a
    // failed revocation must never block the local sign-out that follows.
    if (refreshToken) {
      try {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          json: { refreshToken },
        });
      } catch {
        // Best-effort: proceed to clear the local session regardless.
      }
    }
    sessionStore.clear();
  }, []);

  const value = useMemo<SessionContextValue>(() => {
    const permissions = session?.user.permissions ?? [];
    return {
      session,
      user: session?.user ?? null,
      profile,
      // On the client the store is synchronously hydrated by the time the first
      // snapshot is read; `ready` distinguishes SSR (null) from a hydrated null.
      ready: typeof window !== 'undefined',
      can: (permission: string) => permissions.includes(permission),
      login,
      logout,
    };
  }, [session, profile, login, logout]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

/** Access the session context. Throws if used outside {@link SessionProvider}. */
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
