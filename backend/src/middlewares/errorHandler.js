import { logger } from '../utils/logger.js';

/**
 * Express 5-safe error handler (4-arg).
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.statusCode || err.status || 500;
  const code = err.code || 'ERROR';
  const message =
    status >= 500 ? 'Internal server error' : err.message || 'Request failed';

  if (status >= 500) {
    logger.error(err.message, { stack: err.stack?.split('\n').slice(0, 5) });
  }

  res.status(status).json({
    success: false,
    message,
    code,
    ...(process.env.NODE_ENV === 'development' && status >= 500
      ? { detail: err.message }
      : {}),
  });
}
