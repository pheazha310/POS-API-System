import type { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "../../../constants/http-status";
import { AppError } from "../../../core/errors/app-error";
import { IAuthTokenPayload, UserRole } from "../models/auth.model";
import authService from "../services/auth.service";

export interface AuthenticatedRequest extends Request {
  user?: IAuthTokenPayload;
  token?: string;
}

class AuthMiddleware {
  authenticate = (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
        throw new AppError("Authorization token is required", HTTP_STATUS.UNAUTHORIZED);
      }

      const token = authHeader.split(" ")[1];

      if (!token) {
        throw new AppError("Authorization token is required", HTTP_STATUS.UNAUTHORIZED);
      }

      const user = authService.verifyAccessToken(token);

      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      next(error);
    }
  };

  authorizeRoles = (...allowedRoles: UserRole[]) => {
    return (
      req: AuthenticatedRequest,
      _res: Response,
      next: NextFunction,
    ): void => {
      try {
        const currentRole = req.user?.role as UserRole | undefined;

        if (!currentRole) {
          throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
        }

        if (!allowedRoles.includes(currentRole)) {
          throw new AppError("Forbidden", HTTP_STATUS.FORBIDDEN);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };
}

export const authMiddleware = new AuthMiddleware();
export const requireAuth = authMiddleware.authenticate;
export const requireRoles = (...roles: UserRole[]) => authMiddleware.authorizeRoles(...roles);

export default authMiddleware;
