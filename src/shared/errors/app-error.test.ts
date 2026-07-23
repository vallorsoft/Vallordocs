import { describe, expect, it } from 'vitest';
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from './app-error';

describe('AppError', () => {
  it('exposes only safe fields via toPublicJSON', () => {
    const error = new AppError({
      code: 'INTERNAL',
      httpStatus: 500,
      messageKey: 'errors.generic',
      message: 'database connection string postgres://secret failed',
      context: { secret: 'do-not-leak' },
    });

    const publicJson = error.toPublicJSON();

    expect(publicJson).toEqual({
      code: 'INTERNAL',
      messageKey: 'errors.generic',
    });
    expect(JSON.stringify(publicJson)).not.toContain('do-not-leak');
    expect(JSON.stringify(publicJson)).not.toContain('postgres://secret');
  });

  it('maps typed errors to the correct HTTP status', () => {
    expect(new UnauthorizedError().httpStatus).toBe(401);
    expect(new ForbiddenError().httpStatus).toBe(403);
    expect(new NotFoundError().httpStatus).toBe(404);
  });
});
