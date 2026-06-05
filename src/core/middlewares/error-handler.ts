import type { NextFunction, Request, Response } from 'express';

import { env } from '../../config/env';
import { HTTP_STATUS } from '../../constants/http-status';
import { AppError } from '../errors/app-error';

type ErrorLike = Error & {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
};

const getErrorDetails = (error: ErrorLike): Record<string, unknown> | undefined => {
  const details: Record<string, unknown> = {
    name: error.name,
    message: error.message,
  };

  if (error.code) {
    details.code = error.code;
  }

  if (typeof error.errno === 'number') {
    details.errno = error.errno;
  }

  if (error.sqlState) {
    details.sqlState = error.sqlState;
  }

  if (error.sqlMessage) {
    details.sqlMessage = error.sqlMessage;
  }

  if (error.stack) {
    details.stack = error.stack;
  }

  return details;
};

const getStatusLabel = (statusCode: number): string => {
  switch (statusCode) {
    case HTTP_STATUS.BAD_REQUEST:
      return 'Bad Request';
    case HTTP_STATUS.UNAUTHORIZED:
      return 'Unauthorized';
    case HTTP_STATUS.FORBIDDEN:
      return 'Forbidden';
    case HTTP_STATUS.NOT_FOUND:
      return 'Not Found';
    case HTTP_STATUS.CONFLICT:
      return 'Conflict';
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
    default:
      return 'Internal Server Error';
  }
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const errorLike = error as ErrorLike;

  console.error('[API ERROR]', {
    path: req.originalUrl,
    method: req.method,
    userId: (req as Request & { user?: { id?: number } }).user?.id,
    details: getErrorDetails(errorLike),
  });

  const statusCode = error instanceof AppError ? error.statusCode : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error instanceof AppError ? error.message : 'Internal server error.';

  const response: Record<string, unknown> = {
    success: false,
    statusCode,
    error: getStatusLabel(statusCode),
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  if (env.nodeEnv !== 'production' && !(error instanceof AppError)) {
    response.details = {
      name: errorLike.name,
      code: errorLike.code,
      errno: errorLike.errno,
      sqlState: errorLike.sqlState,
      sqlMessage: errorLike.sqlMessage,
    };
  }

  res.status(statusCode).json(response);
};
