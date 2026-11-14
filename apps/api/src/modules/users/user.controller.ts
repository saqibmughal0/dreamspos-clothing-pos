import { Request, Response, NextFunction } from "express";
import { userService } from "./user.service";
import { AppError, UnauthorizedError, BadRequestError } from "../../utils/errors";

export class UserController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("Authentication required");
      }

      const user = await userService.getCurrentUser(req.user.id);
      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("Authentication required");
      }

      const { name, phone, currentPassword, newPassword } = req.body;
      const user = await userService.updateProfile(req.user.id, {
        name,
        phone,
        currentPassword,
        newPassword
      });

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: { user }
      });
    } catch (err) {
      next(err);
    }
  }

  async requestEmailChange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("Authentication required");
      }

      const { newEmail, currentPassword } = req.body;
      const result = await userService.requestEmailChange(req.user.id, newEmail, currentPassword);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async verifyEmailChange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("Authentication required");
      }

      const { otp } = req.body;
      if (!otp) {
        throw new BadRequestError("Verification code is required");
      }

      const result = await userService.verifyEmailChange(req.user.id, otp);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async linkGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("Authentication required");
      }

      const { credential } = req.body;
      if (!credential) {
        throw new BadRequestError("Google credential is required");
      }

      const result = await userService.linkGoogleAccount(req.user.id, credential);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async unlinkGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("Authentication required");
      }

      const result = await userService.unlinkGoogleAccount(req.user.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("Authentication required");
      }

      if (!req.file || !req.file.buffer) {
        throw new BadRequestError("No image file uploaded");
      }

      const result = await userService.updateAvatar(
        req.user.id,
        req.file.buffer,
        req.file.originalname
      );

      res.status(200).json({
        success: true,
        message: "Profile photo updated successfully",
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async removeAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("Authentication required");
      }

      const result = await userService.removeAvatar(req.user.id);
      res.status(200).json({
        success: true,
        message: "Profile photo removed successfully",
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
