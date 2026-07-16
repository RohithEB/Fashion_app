// Central error + 404 handling. Maps ApiError -> its status; everything else -> 500.
import { ApiError } from '../../util/errors.js';
import { logger } from '../../util/logger.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: 'Route not found', path: req.originalUrl } });
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity (4 args).
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: { message: 'Internal server error' } });
}
