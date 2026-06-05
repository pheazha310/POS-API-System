import type { UserRole } from "../modules/auth/models/auth.model";

export const ROLES = {
  ADMIN: "ADMIN",
  CASHIER: "CASHIER",
  MANAGER: "MANAGER",
} as const satisfies Record<UserRole, UserRole>;

export const VALID_ROLES: UserRole[] = [
  ROLES.ADMIN,
  ROLES.CASHIER,
  ROLES.MANAGER,
];
