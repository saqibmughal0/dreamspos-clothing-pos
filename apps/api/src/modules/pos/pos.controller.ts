import { Request, Response, NextFunction } from "express";
import { posService } from "./pos.service";
import { BadRequestError } from "../../utils/errors";

function parseNonNegativeNumber(raw: any, fieldLabel: string): number {
  if (raw === undefined || raw === null || raw === "") {
    throw new BadRequestError(`${fieldLabel} is required.`);
  }
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) {
    throw new BadRequestError(`${fieldLabel} must be a valid non-negative number.`);
  }
  return num;
}

export class PosController {
  async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const cashierId = req.user!.id;

      const result = await posService.checkout(companyId, cashierId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getReceiptData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const saleId = String(req.params.saleId);
      const receipt = await posService.getReceiptData(saleId, req.user!.companyId);
      if (!receipt) {
        res.status(404).json({ success: false, message: "Receipt not found" });
        return;
      }
      res.status(200).json({ success: true, data: receipt });
    } catch (err) {
      next(err);
    }
  }

  async openRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const storeId = req.user!.storeId || req.body.storeId || null;
      const openingFloat = parseNonNegativeNumber(req.body.openingFloat, "Opening cash amount");

      const session = await posService.openRegister(companyId, storeId, userId, openingFloat);
      res.status(201).json({ success: true, data: session, message: "Cash register shift opened successfully." });
    } catch (err) {
      next(err);
    }
  }

  async closeRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const { sessionId, closingNotes } = req.body;
      if (!sessionId || typeof sessionId !== "string") {
        throw new BadRequestError("Session ID is required.");
      }
      const closingCash = parseNonNegativeNumber(req.body.closingCash, "Actual closing cash");

      const result = await posService.closeRegister(
        companyId,
        userId,
        sessionId,
        closingCash,
        typeof closingNotes === "string" ? closingNotes.trim() : undefined
      );
      res.status(200).json({ success: true, data: result, message: "Cash register closed and reconciled." });
    } catch (err) {
      next(err);
    }
  }

  async recordCashMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const { sessionId, type } = req.body;
      if (!sessionId || typeof sessionId !== "string") {
        throw new BadRequestError("Session ID is required.");
      }
      if (type !== "IN" && type !== "OUT") {
        throw new BadRequestError("Movement type must be IN or OUT.");
      }
      const amount = parseNonNegativeNumber(req.body.amount, "Cash movement amount");
      if (amount <= 0) {
        throw new BadRequestError("Cash movement amount must be greater than zero.");
      }

      const updated = await posService.recordCashMovement(companyId, userId, sessionId, type, amount);
      res.status(200).json({ success: true, data: updated, message: `Cash ${type === "IN" ? "In" : "Out"} recorded.` });
    } catch (err) {
      next(err);
    }
  }

  async getActiveRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const active = await posService.getActiveRegister(companyId, userId);
      res.status(200).json({ success: true, data: active });
    } catch (err) {
      next(err);
    }
  }

  async getRegisterHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { startDate, endDate, storeId, cashierId, registerId } = req.query as Record<string, string | undefined>;
      const data = await posService.getRegisterOverview(companyId, {
        startDate,
        endDate,
        storeId,
        cashierId,
        registerId,
      });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const posController = new PosController();
