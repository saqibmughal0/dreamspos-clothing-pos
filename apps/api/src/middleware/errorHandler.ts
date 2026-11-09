import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";
import { AppError } from "../utils/errors";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`AppError [${err.statusCode}] at ${req.method} ${req.originalUrl}:`, err.message);
    }
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: err.errors.map(e => ({
        field: e.path.join("."),
        message: e.message
      }))
    });
    return;
  }

  // Handle generic errors with statusCode property attached
  if ((err as any).statusCode && typeof (err as any).statusCode === "number") {
    const status = (err as any).statusCode;
    if (status >= 500) {
      logger.error(`Error [${status}] at ${req.method} ${req.originalUrl}:`, err.message);
    }
    res.status(status).json({
      success: false,
      message: err.message
    });
    return;
  }

  // Fallback for unexpected 500 errors
  logger.error(`Unhandled Exception at ${req.method} ${req.originalUrl}:`, err.stack || err.message);

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message
  });
};
