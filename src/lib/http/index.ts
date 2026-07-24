/**
 * Public API of the HTTP support layer (PRD 5. fejezet – API, Hibakezelés).
 *
 * Route handlers import request authentication, the error→HTTP mapping and the
 * response helpers from here. This keeps the wiring between Next.js route
 * handlers and the module/repository layers in one small, tested surface.
 */
export {
  authenticate,
  bearerToken,
  clientMeta,
  type ClientMeta,
} from './context';

export { errorResponse, normalizeError, type ErrorBody } from './errors';

export { json, route, type Handler } from './respond';
