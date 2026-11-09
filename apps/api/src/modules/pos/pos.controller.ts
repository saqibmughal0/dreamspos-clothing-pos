import { Request, Response, NextFunction } from "express";
import { posService } from "./pos.service";

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
      const receipt = await posService.getReceiptData(saleId);
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
      const userId = req.user!.id;
      const storeId = req.user!.storeId || req.body.storeId;
      const openingFloat = Number(req.body.openingFloat || 0);

      const session = await posService.openRegister(storeId, userId, openingFloat);
      res.status(201).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  async closeRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, closingCash } = req.body;
      const result = await posService.closeRegister(sessionId, Number(closingCash));
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getActiveRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const active = await posService.getActiveRegister(userId);
      res.status(200).json({ success: true, data: active });
    } catch (err) {
      next(err);
    }
  }
}

export const posController = new PosController();
