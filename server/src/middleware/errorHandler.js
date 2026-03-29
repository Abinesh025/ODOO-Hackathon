import { AppError } from '../errors/AppError.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode && Number.isFinite(err.statusCode) ? err.statusCode : 500;
  const isDev = process.env.NODE_ENV === 'development';

  if (err instanceof AppError && err.isOperational) {
    const body = { success: false, message: err.message };
    if (err.details) body.details = err.details;
    return res.status(statusCode).json(body);
  }

  console.error(err);
  const message = isDev ? err.message : 'Something went wrong';
  const stack = isDev ? err.stack : undefined;
  return res.status(statusCode).json({
    success: false,
    message,
    ...(stack ? { stack } : {}),
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}
