import express from "express";
import rateLimit from "express-rate-limit";

import { asyncHandler } from "../../../core/utils/async-handler";
import { validateRequest } from "../../../core/middlewares/validate-request";
import authController from "../controllers/auth.controller";
import authMiddleware from "../middlewares/auth.middleware";
import { loginSchema, registerPayloadSchema } from "../validators/auth.schemas";

const router = express.Router();
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authRateLimiter);

router.post(
  "/register",
  registerRateLimiter,
  validateRequest(registerPayloadSchema),
  asyncHandler(authController.register),
);
router.post(
  "/login",
  loginRateLimiter,
  validateRequest(loginSchema),
  asyncHandler(authController.login),
);
router.post("/logout", authMiddleware.authenticate, asyncHandler(authController.logout));
router.get("/me", authMiddleware.authenticate, asyncHandler(authController.me));

export default router;
