import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

import { HTTP_STATUS } from "../../constants/http-status";
import { AppError } from "../errors/app-error";

export const validateRequest =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(new AppError(result.error.issues[0]?.message ?? "Validation error", HTTP_STATUS.BAD_REQUEST));
      return;
    }

    req.body = result.data;
    next();
  };
