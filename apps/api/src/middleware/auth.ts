import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { UserRole } from "@dreamspos/shared";

export interface AuthenticatedUser {
  id: string;
  companyId: string;
  storeId?: string | null;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Unauthorized: Missing authentication token" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthenticatedUser;
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
  }
};

export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Forbidden: You lack necessary permissions to perform this action"
      });
      return;
    }

    next();
  };
};
