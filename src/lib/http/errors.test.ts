// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ForbiddenError, NotFoundError } from '@/shared/errors';
import { errorResponse, normalizeError } from './errors';

describe('normalizeError', () => {
  it('passes an AppError through untouched', () => {
    const { appError, issues } = normalizeError(new ForbiddenError());
    expect(appError.code).toBe('FORBIDDEN');
    expect(appError.httpStatus).toBe(403);
    expect(issues).toBeUndefined();
  });

  it('maps a ZodError to a VALIDATION error with field issues', () => {
    const schema = z.object({ email: z.string().email('validation.email') });
    const parsed = schema.safeParse({ email: 'nope' });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const { appError, issues } = normalizeError(parsed.error);
    expect(appError.code).toBe('VALIDATION');
    expect(appError.httpStatus).toBe(422);
    expect(issues).toEqual([{ path: 'email', messageKey: 'validation.email' }]);
  });

  it('never surfaces an unknown error message', () => {
    const { appError } = normalizeError(
      new Error('postgres://secret-connection failed'),
    );
    expect(appError.code).toBe('INTERNAL');
    expect(appError.httpStatus).toBe(500);
  });
});

describe('errorResponse', () => {
  it('serialises only the safe fields', async () => {
    const response = errorResponse(
      new NotFoundError({ secret: 'do-not-leak' }),
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ code: 'NOT_FOUND', messageKey: 'errors.notFound' });
    expect(JSON.stringify(body)).not.toContain('do-not-leak');
  });
});
