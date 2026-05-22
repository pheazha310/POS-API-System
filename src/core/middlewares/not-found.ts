import { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "../../constants/http-status";
import { MESSAGES } from "../../constants/messages";
import { createErrorResponse } from "../utils/api-response";

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  res
    .status(HTTP_STATUS.NOT_FOUND)
    .json(
      createErrorResponse(
        HTTP_STATUS.NOT_FOUND,
        "Not Found",
        MESSAGES.ROUTE_NOT_FOUND,
        req.originalUrl,
      ),
    );
};
