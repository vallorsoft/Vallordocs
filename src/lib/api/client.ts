import { sessionStore } from '@/lib/session/store';
import type { ErrorBody } from '@/lib/http/errors';

/**
 * Browser API client (PRD 2. fejezet – Munkamenet, token frissítés; 5. fejezet –
 * Hibakezelés).
 *
 * A thin `fetch` wrapper that attaches the bearer access token, transparently
 * refreshes it once on a `401`, and turns every error body into a typed
 * {@link ApiError} whose `messageKey` the UI translates. Refreshes are
 * single-flight: concurrent requests that hit a `401` share one refresh call
 * rather than stampeding the endpoint.
 */

/** A safe, translatable error surfaced to the UI. Mirrors the server envelope. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** Translation key resolvable with `useTranslations()` (e.g. `errors.notFound`). */
    readonly messageKey: string,
    readonly code?: string,
    readonly issues?: ErrorBody['issues'],
  ) {
    super(messageKey);
    this.name = 'ApiError';
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/** Attempts a single-flight token refresh. Resolves true on success. */
async function refreshTokens(): Promise<boolean> {
  const refreshToken = sessionStore.getRefreshToken();
  if (!refreshToken) return false;

  refreshInFlight ??= (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;
      const data = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
      };
      sessionStore.updateTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Builds request headers, attaching the current access token when present. */
function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set('accept', 'application/json');
  const token = sessionStore.getAccessToken();
  if (token) headers.set('authorization', `Bearer ${token}`);
  return headers;
}

/** Parses an error response into an {@link ApiError}, degrading gracefully. */
async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ErrorBody;
    return new ApiError(
      response.status,
      body.messageKey ?? 'errors.generic',
      body.code,
      body.issues,
    );
  } catch {
    return new ApiError(response.status, 'errors.generic');
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  /** JSON body; serialised automatically with the correct content-type. */
  json?: unknown;
}

/**
 * Performs an authenticated JSON request and returns the parsed body.
 * On a `401` it refreshes the token once and retries; a second `401`, or a
 * failed refresh, clears the session and throws so the UI can redirect to login.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { json, headers, ...init } = options;
  const requestHeaders = buildHeaders(headers);
  if (json !== undefined) {
    requestHeaders.set('content-type', 'application/json');
  }

  const requestInit: RequestInit = {
    ...init,
    headers: requestHeaders,
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
  };

  let response = await fetch(path, requestInit);

  if (response.status === 401 && sessionStore.getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      response = await fetch(path, {
        ...requestInit,
        headers: buildHeaders(headers),
      });
    }
    if (response.status === 401) {
      sessionStore.clear();
      throw await toApiError(response);
    }
  }

  if (!response.ok) throw await toApiError(response);

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
