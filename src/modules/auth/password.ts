import { hash, verify } from '@node-rs/argon2';
import { ValidationError } from '@/shared/errors';

/**
 * Password hashing and strength policy (PRD 2./5. fejezet – Jelszavak).
 *
 * Passwords are hashed with Argon2id and never stored in plain or reversible
 * form. The strength policy enforces the PRD requirements: at least 12
 * characters containing lower-case, upper-case, digit and special characters.
 */

/** Argon2id parameters. OWASP-aligned defaults; tuned for a server context. */
const ARGON2_OPTIONS = {
  // 0 = Argon2d, 1 = Argon2i, 2 = Argon2id. Argon2id is the recommended mode.
  algorithm: 2,
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export const PASSWORD_MIN_LENGTH = 12;

export type PasswordRule =
  'length' | 'lowercase' | 'uppercase' | 'digit' | 'special';

export interface PasswordPolicyResult {
  valid: boolean;
  /** Rules that were not satisfied; empty when the password is valid. */
  failed: PasswordRule[];
}

/**
 * Evaluates a candidate password against the policy without throwing. Useful
 * for surfacing per-rule feedback in the UI.
 */
export function checkPasswordStrength(password: string): PasswordPolicyResult {
  const failed: PasswordRule[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) failed.push('length');
  if (!/[a-z]/.test(password)) failed.push('lowercase');
  if (!/[A-Z]/.test(password)) failed.push('uppercase');
  if (!/[0-9]/.test(password)) failed.push('digit');
  // Anything that is not a letter or digit counts as a special character.
  if (!/[^A-Za-z0-9]/.test(password)) failed.push('special');

  return { valid: failed.length === 0, failed };
}

/**
 * Asserts that a password meets the policy, throwing a {@link ValidationError}
 * (never leaking the password itself) when it does not.
 */
export function assertPasswordStrength(password: string): void {
  const result = checkPasswordStrength(password);
  if (!result.valid) {
    throw new ValidationError({
      messageKey: 'errors.weakPassword',
      context: { failedRules: result.failed },
    });
  }
}

/**
 * Hashes a password with Argon2id after enforcing the strength policy. The
 * returned encoded string embeds the algorithm parameters and salt.
 */
export async function hashPassword(password: string): Promise<string> {
  assertPasswordStrength(password);
  return hash(password, ARGON2_OPTIONS);
}

/**
 * Verifies a plaintext password against a stored Argon2 hash. Returns `false`
 * for any malformed hash rather than throwing, so authentication code can treat
 * it as a simple credential mismatch.
 */
export async function verifyPassword(
  storedHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(storedHash, password);
  } catch {
    return false;
  }
}
