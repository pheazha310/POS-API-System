import bcrypt from "bcryptjs";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

import { env } from "../../../config/env";
import {
  IAuthTokenPayload,
  IUser,
  IUserPayload,
} from "../models/auth.model";
import authRepository from "../repositories/auth.repository";

class AuthService {
  private sanitizeUser(user: IUser): IUserPayload {
    return {
      id: user.id as number,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  private validateRegisterInput(data: Partial<IUser>) {
    if (!data.name?.trim()) {
      throw new Error("Name is required");
    }

    if (!data.email?.trim()) {
      throw new Error("Email is required");
    }

    if (!data.password?.trim()) {
      throw new Error("Password is required");
    }

    if (data.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
  }

  async register(data: Partial<IUser>) {
    this.validateRegisterInput(data);
    const name = data.name as string;
    const email = data.email as string;
    const password = data.password as string;
    const role = data.role?.trim() || "staff";

    const existingUser = await authRepository.findByEmail(
      email.trim().toLowerCase()
    );

    if (existingUser) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    await authRepository.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
    });

    return {
      message: "Register successful",
    };
  }

  async login(email: string, password: string) {
    if (!email?.trim()) {
      throw new Error("Email is required");
    }

    if (!password?.trim()) {
      throw new Error("Password is required");
    }

    const user = await authRepository.findByEmail(
      email.trim().toLowerCase()
    );

    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      throw new Error("Invalid password");
    }

    const signOptions: SignOptions = {
      expiresIn: env.jwtAccessExpiresIn as SignOptions["expiresIn"],
    };

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      env.jwtAccessSecret,
      signOptions
    );

    return {
      token,
      user: this.sanitizeUser(user),
    };
  }

  verifyAccessToken(token: string): IAuthTokenPayload {
    const decoded = jwt.verify(
      token,
      env.jwtAccessSecret
    ) as JwtPayload;

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

  async getCurrentUser(userId: number) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}

export default new AuthService();
