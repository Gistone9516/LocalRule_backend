import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../utils/errors';
import { errorResponse } from '../utils/response';
import { config } from '../config';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  const requestId = (req as Request & { id?: string }).id;

  if (err instanceof AppError) {
    return errorResponse(res, err.code, err.message, err.statusCode, err.details, requestId);
  }

  // Log unexpected errors
  // eslint-disable-next-line no-console
  console.error('Unexpected error:', err);

  // Don't expose internal error details in production
  const message = config.isProduction() ? 'Internal server error' : err.message;

  return errorResponse(res, ErrorCode.INTERNAL_ERROR, message, 500, undefined, requestId);
}

export function notFoundHandler(req: Request, res: Response): Response {
  const requestId = (req as Request & { id?: string }).id;
  return errorResponse(
    res,
    ErrorCode.NOT_FOUND,
    `Route ${req.method} ${req.path} not found`,
    404,
    undefined,
    requestId
  );
}
