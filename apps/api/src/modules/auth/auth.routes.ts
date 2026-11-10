import { Router } from "express";
import { authController } from "./auth.controller";
import { validateBody } from "../../middleware/validate";
import { LoginSchema } from "@dreamspos/shared";
import { authenticate } from "../../middleware/auth";

export const authRouter = Router();

authRouter.post("/login", validateBody(LoginSchema), authController.login);
authRouter.post("/register", authController.register);
authRouter.post("/refresh", authController.refreshToken);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authenticate, authController.me);
