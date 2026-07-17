// Bearer-token auth guard. Attaches req.salesperson (public shape) or throws 401.
import * as authSvc from '../../services/auth.service.js';
import { unauthorized } from '../../util/errors.js';

export function bearerToken(req) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function requireAuth(req, _res, next) {
  const token = bearerToken(req);
  if (!token) return next(unauthorized('Missing bearer token'));
  req.salesperson = authSvc.verifyToken(token); // throws 401 if invalid
  req.authToken = token;
  next();
}
