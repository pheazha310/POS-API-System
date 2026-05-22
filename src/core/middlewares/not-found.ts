import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../../constants/http-status';
import { MESSAGES } from '../../constants/messages';
import { AppError } from '../errors/app-error';

export const notFoundHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(new AppError(MESSAGES.ROUTE_NOT_FOUND, HTTP_STATUS.NOT_FOUND));
};
