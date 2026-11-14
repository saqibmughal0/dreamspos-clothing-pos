import { Router } from "express";
import { authController } from "./auth.controller";
import { validateBody } from "../../middleware/validate";
import { LoginSchema } from "@dreamspos/shared";
import { authenticate } from "../../middleware/auth";

export const authRouter = Router();

authRouter.post("/login", validateBody(LoginSchema), authController.login.bind(authController));
authRouter.post("/register", authController.register.bind(authController));
authRouter.post("/verify-email", authController.verifyEmail.bind(authController));
authRouter.post("/resend-verification", authController.resendVerification.bind(authController));
authRouter.post("/google", authController.googleAuth.bind(authController));
authRouter.post("/forgot-password", authController.forgotPassword.bind(authController));
authRouter.post("/reset-password", authController.resetPassword.bind(authController));
authRouter.post("/refresh", authController.refreshToken.bind(authController));
authRouter.post("/logout", authController.logout.bind(authController));
authRouter.get("/me", authenticate, authController.me.bind(authController));
