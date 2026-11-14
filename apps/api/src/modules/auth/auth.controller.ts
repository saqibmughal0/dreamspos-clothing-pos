import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { userService } from "../users/user.service";
import { AppError } from "../../utils/errors";

export class AuthController {
  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      this.setRefreshCookie(res, result.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (err: any) {
      if (err.requiresVerification) {
        res.status(403).json({
          success: false,
          requiresVerification: true,
          email: err.email,
          message: err.message
        });
        return;
      }
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        });
        return;
      }
      if (err.message && err.message.toLowerCase().includes("invalid email or password")) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
        return;
      }
      next(err);
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const result = await authService.register({ name, email, password });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        });
        return;
      }
      next(err);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, token } = req.body;
      const result = await authService.verifyEmail({ email, token });

      if (result.refreshToken) {
        this.setRefreshCookie(res, result.refreshToken);
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.user ? { user: result.user, accessToken: result.accessToken } : undefined
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        });
        return;
      }
      next(err);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.resendVerification(email);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        });
        return;
      }
      next(err);
    }
  }

  async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { credential } = req.body;
      const result = await authService.googleAuth(credential);
      this.setRefreshCookie(res, result.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (err: any) {
      if (err.code === "ACCOUNT_EXISTS_LINKING_REQUIRED") {
        res.status(409).json({
          success: false,
          code: "ACCOUNT_EXISTS_LINKING_REQUIRED",
          message: err.message
        });
        return;
      }
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        });
        return;
      }
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        });
        return;
      }
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, token, newPassword } = req.body;
      const result = await authService.resetPassword({ email, token, newPassword });

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        });
        return;
      }
      next(err);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        res.status(401).json({ success: false, message: "Refresh token missing" });
        return;
      }

      const result = await authService.refreshToken(token);
      this.setRefreshCookie(res, result.refreshToken);

      res.status(200).json({
        success: true,
        data: { accessToken: result.accessToken }
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        });
        return;
      }
      res.status(401).json({
        success: false,
        message: err.message || "Invalid or expired refresh token"
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      await authService.logout(token).catch(() => {});
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const user = await userService.getCurrentUser(req.user.id);
      res.status(200).json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
