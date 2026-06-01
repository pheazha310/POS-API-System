import express from "express";

import authController from "../controllers/auth.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = express.Router();

// Public (mounted at /api/auth)
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected
router.post("/logout", authMiddleware.authenticate, authController.logout);
router.get("/me", authMiddleware.authenticate, authController.me);

export default router;
