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

  async getRecentOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const orders = await posService.getRecentOrders(companyId);
      res.status(200).json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  }
}

export const posController = new PosController();
