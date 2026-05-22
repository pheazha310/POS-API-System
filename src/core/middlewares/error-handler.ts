import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../../constants/http-status';
import { AppError } from '../errors/app-error';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Internal server error.',
  });
};
