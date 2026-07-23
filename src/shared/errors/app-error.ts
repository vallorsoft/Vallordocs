/**
 * Base application error hierarchy (PRD 2./5. fejezet – Hibakezelés).
 *
 * User-facing responses must only ever expose the safe `code` and a translated
 * message key. Detailed context stays server-side for logging and never leaks
 * to the client (no stack traces, SQL, file paths, secrets).
 */
export type AppErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly httpStatus: number;
  /** Translation key resolved by the UI; never a raw string. */
  public readonly messageKey: string;
  /** Server-only diagnostic context. Never serialised to clients. */
  public readonly context?: Record<string, unknown>;

  constructor(params: {
    code: AppErrorCode;
    httpStatus: number;
    messageKey: string;
    message?: string;
    context?: Record<string, unknown>;
  }) {
    super(params.message ?? params.messageKey);
    this.name = new.target.name;
    this.code = params.code;
    this.httpStatus = params.httpStatus;
    this.messageKey = params.messageKey;
    this.context = params.context;
  }

  /** The only shape that may be sent to a client. */
  toPublicJSON(): { code: AppErrorCode; messageKey: string } {
    return { code: this.code, messageKey: this.messageKey };
  }
}

export class UnauthorizedError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: 'UNAUTHORIZED',
      httpStatus: 401,
      messageKey: 'errors.unauthorized',
      context,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: 'FORBIDDEN',
      httpStatus: 403,
      messageKey: 'errors.unauthorized',
      context,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: 'NOT_FOUND',
      httpStatus: 404,
      messageKey: 'errors.notFound',
      context,
    });
  }
}

export class ValidationError extends AppError {
  constructor(params?: {
    messageKey?: string;
    message?: string;
    context?: Record<string, unknown>;
  }) {
    super({
      code: 'VALIDATION',
      httpStatus: 422,
      messageKey: params?.messageKey ?? 'errors.validation',
      message: params?.message,
      context: params?.context,
    });
  }
}

export class ConflictError extends AppError {
  constructor(params?: {
    messageKey?: string;
    message?: string;
    context?: Record<string, unknown>;
  }) {
    super({
      code: 'CONFLICT',
      httpStatus: 409,
      messageKey: params?.messageKey ?? 'errors.conflict',
      message: params?.message,
      context: params?.context,
    });
  }
}

export class RateLimitedError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super({
      code: 'RATE_LIMITED',
      httpStatus: 429,
      messageKey: 'errors.rateLimited',
      context,
    });
  }
}

/**
 * Wraps an unexpected failure. The public payload only ever exposes the generic
 * message key, so internal details (stack traces, SQL, paths, secrets) never
 * leak to the client (PRD 5. fejezet – Hibakezelés).
 */
export class InternalError extends AppError {
  constructor(params?: {
    message?: string;
    context?: Record<string, unknown>;
  }) {
    super({
      code: 'INTERNAL',
      httpStatus: 500,
      messageKey: 'errors.generic',
      message: params?.message,
      context: params?.context,
    });
  }
}
