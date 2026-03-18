import { Router } from "express";
import { login, logout, me, register } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { loginRateLimit, registerRateLimit } from "../middleware/rate-limit.middleware.js";

export const authRouter = Router();

authRouter.post("/register", registerRateLimit, register);
authRouter.post("/login", loginRateLimit, login);
authRouter.post("/logout", logout);
authRouter.get("/me", authMiddleware, me);