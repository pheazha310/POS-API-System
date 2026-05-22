import { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "../../constants/http-status";
import { MESSAGES } from "../../constants/messages";
import { AppError } from "../errors/app-error";
import { createErrorResponse } from "../utils/api-response";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode =
    error instanceof AppError
      ? error.statusCode
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

  const response = createErrorResponse(
    statusCode,
    error.name || "Error",
    error.message || MESSAGES.INTERNAL_SERVER_ERROR,
    req.originalUrl,
  );

  res.status(statusCode).json(response);
};
