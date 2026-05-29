import { NextFunction, Request, Response } from "express";

import { IAuthTokenPayload } from "../models/auth.model";
import authService from "../services/auth.service";

interface AuthenticatedRequest extends Request {
  user?: IAuthTokenPayload;
}

class AuthMiddleware {
  authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
          message: "Authorization token is required",
        });
      }

      const token = authHeader.split(" ")[1];
      const user = authService.verifyAccessToken(token);

      req.user = user;
      next();
    } catch (error: any) {
      return res.status(401).json({
        message: error.message || "Invalid token",
      });
    }
  }
}

export default new AuthMiddleware();
