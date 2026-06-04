import bcrypt from "bcrypt";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

import { env } from "../../../config/env";
import {
  IAuthTokenPayload,
  IUser,
  IUserPayload,
  UserRole,
} from "../models/auth.model";
import authRepository from "../repositories/auth.repository";

const tokenBlacklist = new Set<string>();
const VALID_ROLES: UserRole[] = ["ADMIN", "CASHIER", "MANAGER"];

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
    if (!data.name?.trim()) throw new Error("Name is required");

    if (!data.email?.trim()) throw new Error("Email is required");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim()))
      throw new Error("Invalid email format");

    if (!data.password?.trim()) throw new Error("Password is required");

    if (data.password.length < 6)
      throw new Error("Password must be at least 6 characters");

    if (data.role && !VALID_ROLES.includes(data.role as UserRole))
      throw new Error(`Role must be one of: ${VALID_ROLES.join(", ")}`);
  }

  async register(data: Partial<IUser>) {
    this.validateRegisterInput(data);

    const name     = data.name!.trim();
    const email    = data.email!.trim().toLowerCase();
    const password = data.password!;
    const role: UserRole = (data.role as UserRole) || "CASHIER";

    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) throw new Error("Email already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

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
      throw new Error("Users array is required");
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
    if (!email?.trim()) throw new Error("Email is required");
    if (!password?.trim()) throw new Error("Password is required");

    const user = await authRepository.findByEmail(email.trim().toLowerCase());
    if (!user) throw new Error("Invalid email or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid email or password");

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
    if (tokenBlacklist.has(token))
      throw new Error("Token has been invalidated");

    const decoded = jwt.verify(token, env.jwtAccessSecret) as JwtPayload;

    if (
      typeof decoded !== "object" ||
      typeof decoded.id !== "number" ||
      typeof decoded.role !== "string"
    ) {
      throw new Error("Invalid token payload");
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
    if (!user) throw new Error("User not found");
    return user;
  }
}

export default new AuthService();
