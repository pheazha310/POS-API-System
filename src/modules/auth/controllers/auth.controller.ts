import { Request, Response } from "express";

import { HTTP_STATUS } from "../../../constants/http-status";
import { AppError } from "../../../core/errors/app-error";
import { createSuccessResponse } from "../../../core/utils/api-response";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import authService from "../services/auth.service";

class AuthController {
  async register(req: Request, res: Response) {
    if (Array.isArray(req.body)) {
      const result = await authService.registerBulk(req.body);
      const hasFailures = result.failureCount > 0;

      return res.status(hasFailures ? 207 : HTTP_STATUS.CREATED).json(
        createSuccessResponse("Register completed", result),
      );
    }

    const result = await authService.register(req.body);
    return res
      .status(HTTP_STATUS.CREATED)
      .json(createSuccessResponse("Register successful", result));
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse("Login successful", result));
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    if (!req.token) {
      throw new AppError("Authorization token is required", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = authService.logout(req.token);
    return res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse("Logout successful", result));
  }

  async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await authService.getCurrentUser(req.user.id);
    return res
      .status(HTTP_STATUS.OK)
      .json(createSuccessResponse("Current user fetched successfully", user));
  }
}

export default new AuthController();
