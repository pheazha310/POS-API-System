import { Request, Response } from "express";

import { IAuthTokenPayload } from "../models/auth.model";
import authService from "../services/auth.service";

interface AuthenticatedRequest extends Request {
  user?: IAuthTokenPayload;
}

class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(
        email,
        password
      );

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  async me(req: AuthenticatedRequest, res: Response) {
    try {
      const authUser = req.user;

      if (!authUser) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const user = await authService.getCurrentUser(authUser.id);

      return res.status(200).json({
        user,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }
}

export default new AuthController();
