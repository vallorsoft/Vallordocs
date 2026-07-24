import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import {
  AppError,
  ConflictError,
  InternalError,
  NotFoundError,
  ValidationError,
  type AppErrorCode,
} from '@/shared/errors';

/**
 * Error → HTTP mapping (PRD 5. fejezet – Hibakezelés).
 *
 * The single choke point that turns any thrown value into a safe HTTP response.
 * Only the stable `code`, a translation `messageKey`, and — for validation
 * failures — non-sensitive field issue keys ever reach the client. Internal
 * details (stack traces, SQL, Prisma metadata, secrets) are deliberately dropped
 * so nothing leaks.
 */

/** The only body shape sent to clients on error. */
export interface ErrorBody {
  code: AppErrorCode;
  messageKey: string;
  /** Present only for validation errors: per-field translation keys. */
  issues?: Array<{ path: string; messageKey: string }>;
}

/** Maps a Zod validation failure to a safe {@link ValidationError} envelope. */
function fromZodError(error: ZodError): {
  appError: AppError;
  issues: ErrorBody['issues'];
} {
  const issues = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    // Zod messages in this codebase are translation keys, never raw strings.
    messageKey: issue.message,
  }));
  return { appError: new ValidationError(), issues };
}

/** Maps known Prisma errors to safe {@link AppError}s without leaking details. */
function fromPrismaError(
  error: Prisma.PrismaClientKnownRequestError,
): AppError {
  switch (error.code) {
    case 'P2002': // unique constraint violation
      return new ConflictError();
    case 'P2025': // record required but not found
      return new NotFoundError();
    default:
      return new InternalError({ message: `prisma:${error.code}` });
  }
}

/** Normalises any thrown value into an {@link AppError} plus optional issues. */
export function normalizeError(error: unknown): {
  appError: AppError;
  issues?: ErrorBody['issues'];
} {
  if (error instanceof AppError) return { appError: error };
  if (error instanceof ZodError) return fromZodError(error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return { appError: fromPrismaError(error) };
  }
  // Unknown failure: never surface its message.
  return { appError: new InternalError() };
}

/** Serialises any thrown value into a safe {@link NextResponse}. */
export function errorResponse(error: unknown): NextResponse<ErrorBody> {
  const { appError, issues } = normalizeError(error);
  const body: ErrorBody = { ...appError.toPublicJSON() };
  if (issues && issues.length > 0) body.issues = issues;
  return NextResponse.json(body, { status: appError.httpStatus });
}
