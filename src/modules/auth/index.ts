/**
 * Public API of the auth module (PRD 2. fejezet – Authentikáció, RBAC).
 *
 * Other modules import authentication, session and authorisation primitives
 * from here and never reach into the module's internal files.
 */
export {
  PASSWORD_MIN_LENGTH,
  checkPasswordStrength,
  assertPasswordStrength,
  hashPassword,
  verifyPassword,
  type PasswordRule,
  type PasswordPolicyResult,
} from './password';

export {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  type AccessTokenClaims,
  type RefreshTokenClaims,
} from './tokens';

export {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  permissionsForRoles,
  can,
  canAll,
  canAny,
  requirePermission,
  type Permission,
  type Principal,
} from './rbac';
