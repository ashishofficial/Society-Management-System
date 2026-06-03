import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  const isProd = env.nodeEnv === 'production';

  // Map Mongoose validation/cast errors to a clean 400 instead of a 500 that leaks schema details.
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    statusCode = 400;
    if (isProd) message = 'Invalid request data';
  }

  // Never expose internal 5xx details (stack/driver messages) to clients in production.
  if (isProd && statusCode >= 500) {
    message = 'Internal server error';
  }
  if (!isProd) {
    console.error(err);
  }

  res.status(statusCode).json({
    message,
    ...(!isProd ? { stack: err.stack } : {}),
  });
}
