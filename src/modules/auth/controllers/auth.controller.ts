import { Request, Response } from "express";

import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import authService from "../services/auth.service";

class AuthController {
  async register(req: Request, res: Response) {
    try {
      if (Array.isArray(req.body)) {
        const result = await authService.registerBulk(req.body);
        const hasFailures = result.failureCount > 0;

        return res.status(hasFailures ? 207 : 201).json(result);
      }

      const result = await authService.register(req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      const result = authService.logout(req.token!);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await authService.getCurrentUser(req.user.id);
      return res.status(200).json({ user });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}

export default new AuthController();
