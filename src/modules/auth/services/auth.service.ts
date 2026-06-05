import bcrypt from "bcrypt";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

import { env } from "../../../config/env";
import { HTTP_STATUS } from "../../../constants/http-status";
import { AppError } from "../../../core/errors/app-error";
import { VALID_ROLES } from "../../../constants/roles";
import {
  IAuthTokenPayload,
  IUser,
  IUserPayload,
  UserRole,
} from "../models/auth.model";
import authRepository from "../repositories/auth.repository";

const tokenBlacklist = new Set<string>();

type BulkRegisterSuccessResult = {
  index: number;
  email: string;
  success: true;
  message: string;
  userId: number;
};

type BulkRegisterFailureResult = {
  index: number;
  email: string;
  success: false;
  error: string;
};

type BulkRegisterResult = BulkRegisterSuccessResult | BulkRegisterFailureResult;

class AuthService {
  private sanitizeUser(user: IUser & { id: number }): IUserPayload {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  private validateRegisterInput(data: Partial<IUser>) {
    if (!data.name?.trim()) {
      throw new AppError("Name is required", HTTP_STATUS.BAD_REQUEST);
    }

    if (!data.email?.trim()) {
      throw new AppError("Email is required", HTTP_STATUS.BAD_REQUEST);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim()))
      throw new AppError("Invalid email format", HTTP_STATUS.BAD_REQUEST);

    if (!data.password?.trim()) {
      throw new AppError("Password is required", HTTP_STATUS.BAD_REQUEST);
    }

    if (data.password.length < 8) {
      throw new AppError(
        "Password must be at least 8 characters",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (data.role && !VALID_ROLES.includes(data.role as UserRole)) {
      throw new AppError(
        `Role must be one of: ${VALID_ROLES.join(", ")}`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  async register(data: Partial<IUser>) {
    this.validateRegisterInput(data);

    const name     = data.name!.trim();
    const email    = data.email!.trim().toLowerCase();
    const password = data.password!;
    const role: UserRole = (data.role as UserRole) || "CASHIER";

    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError("Email already exists", HTTP_STATUS.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(password, env.bcryptSaltRounds);

    const insertId = await authRepository.createUser({
      name,
      email,
      password: hashedPassword,
      role,
    });

    return { message: "Register successful", userId: insertId };
  }

  async registerBulk(data: Array<Partial<IUser>>) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new AppError("Users array is required", HTTP_STATUS.BAD_REQUEST);
    }

    const results: BulkRegisterResult[] = [];

    for (let index = 0; index < data.length; index += 1) {
      const item = data[index];

      try {
        const result = await this.register(item);

        results.push({
          index,
          email: item.email?.trim().toLowerCase() ?? "",
          success: true,
          ...result,
        } as BulkRegisterSuccessResult);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";

        results.push({
          index,
          email: item.email?.trim().toLowerCase() ?? "",
          success: false,
          error: message,
        } as BulkRegisterFailureResult);
      }
    }

    return {
      message: "Bulk register completed",
      successCount: results.filter((result) => result.success).length,
      failureCount: results.filter((result) => !result.success).length,
      results,
    };
  }

  async login(email: string, password: string) {
    if (!email?.trim()) {
      throw new AppError("Email is required", HTTP_STATUS.BAD_REQUEST);
    }

    if (!password?.trim()) {
      throw new AppError("Password is required", HTTP_STATUS.BAD_REQUEST);
    }

    const user = await authRepository.findByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new AppError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED);
    }

    const signOptions: SignOptions = {
      expiresIn: env.jwtAccessExpiresIn as SignOptions["expiresIn"],
    };

    const token = jwt.sign(
      { id: user.id, role: user.role },
      env.jwtAccessSecret,
      signOptions
    );

    return {
      message: "Login successful",
      token,
      user: this.sanitizeUser(user),
    };
  }

  logout(token: string) {
    tokenBlacklist.add(token);
    return { message: "Logout successful" };
  }

  verifyAccessToken(token: string): IAuthTokenPayload {
    if (tokenBlacklist.has(token)) {
      throw new AppError("Token has been invalidated", HTTP_STATUS.UNAUTHORIZED);
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
    } catch (_error) {
      throw new AppError("Invalid or expired token", HTTP_STATUS.UNAUTHORIZED);
    }

    if (
      typeof decoded !== "object" ||
      typeof decoded.id !== "number" ||
      typeof decoded.role !== "string"
    ) {
      throw new AppError("Invalid token payload", HTTP_STATUS.UNAUTHORIZED);
    }

    return {
      id: decoded.id,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  }

  async getCurrentUser(userId: number): Promise<IUserPayload> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }
    return user;
  }
}

export default new AuthService();
