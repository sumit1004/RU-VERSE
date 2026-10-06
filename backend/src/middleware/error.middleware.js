import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';

export const notFoundHandler = (req, res) => {
  return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
};

export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[Error Middleware]:', err);

  // Body parser syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'Invalid JSON payload received.', 400);
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
    return sendError(res, `A record with this ${target} already exists.`, 409);
  }

  // Prisma record not found error
  if (err.code === 'P2025') {
    return sendError(res, 'Requested resource was not found.', 404);
  }

  // Custom status code error
  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const message = env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error occurred.'
    : err.message || 'Internal server error occurred.';

  return sendError(res, message, statusCode, err.errors || null);
};
