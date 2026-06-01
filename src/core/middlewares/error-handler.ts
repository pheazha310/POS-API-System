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

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const errorLike = error as ErrorLike;

  console.error('[API ERROR]', getErrorDetails(errorLike));

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  const response: Record<string, unknown> = {
    success: false,
    message: 'Internal server error.',
  };

  if (env.nodeEnv !== 'production') {
    response.error = {
      name: errorLike.name,
      code: errorLike.code,
      errno: errorLike.errno,
      sqlState: errorLike.sqlState,
      sqlMessage: errorLike.sqlMessage,
    };
  }

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
};
