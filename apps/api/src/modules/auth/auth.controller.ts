import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { AppError } from "../../utils/errors";

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);

      // Set HttpOnly cookie for refresh token
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (err: any) {
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
      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          message: "Name, email and password are required"
        });
        return;
      }

      const result = await authService.register({ name, email, password });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
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
      res.status(200).json({ success: true, data: result });
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
    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  }

  async me(req: Request, res: Response): Promise<void> {
    res.status(200).json({ success: true, data: { user: req.user } });
  }
}

export const authController = new AuthController();
