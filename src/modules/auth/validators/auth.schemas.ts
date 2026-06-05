import { z } from "zod";

import type { UserRole } from "../models/auth.model";

const roleSchema = z.enum(["ADMIN", "CASHIER", "MANAGER"]);

const baseRegisterSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: roleSchema.optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = baseRegisterSchema;

export const registerBulkSchema = z.array(baseRegisterSchema).min(1, "Users array is required");

export const registerPayloadSchema = z.union([registerSchema, registerBulkSchema]);

export const isValidUserRole = (value: unknown): value is UserRole => roleSchema.safeParse(value).success;
