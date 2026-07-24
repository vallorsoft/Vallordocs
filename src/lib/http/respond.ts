import { NextResponse } from 'next/server';
import { errorResponse } from './errors';

/**
 * Route handler plumbing (PRD 5. fejezet – Hibakezelés).
 *
 * Every route handler is wrapped so that any thrown value — validation,
 * authorisation, Prisma or unexpected — is funnelled through the single
 * {@link errorResponse} choke point and never leaks internals. Handlers stay
 * thin: parse → guard → call repository/module → {@link json}.
 */

/** A JSON response with the given status (defaults to 200). */
export function json<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/** A minimal handler signature: it receives the request and returns a response. */
export type Handler<Args extends unknown[] = []> = (
  request: import('next/server').NextRequest,
  ...args: Args
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a handler so thrown errors become safe HTTP responses. Use it for every
 * route:
 *
 *   export const GET = route(async (req) => json(await load(req)));
 */
export function route<Args extends unknown[]>(
  handler: Handler<Args>,
): Handler<Args> {
  return async (request, ...args) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
