import { Request, Response, NextFunction } from "express";
import { inventoryService } from "./inventory.service";

export class InventoryController {
  async createAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const adjustment = await inventoryService.createAdjustment(companyId, req.body);
      res.status(201).json({ success: true, data: adjustment });
    } catch (err) {
      next(err);
    }
  }

  async listAdjustments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { warehouseId, type, page, limit } = req.query;

      const result = await inventoryService.listAdjustments(companyId, {
        warehouseId: warehouseId as string,
        type: type as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async createTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const transfer = await inventoryService.createTransfer(companyId, req.body);
      res.status(201).json({ success: true, data: transfer });
    } catch (err) {
      next(err);
    }
  }

  async listTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { page, limit } = req.query;

      const result = await inventoryService.listTransfers(companyId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getValuation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const valuation = await inventoryService.getValuation(companyId);
      res.status(200).json({ success: true, data: valuation });
    } catch (err) {
      next(err);
    }
  }

  async getLowStockAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const alerts = await inventoryService.getLowStockAlerts(companyId);
      res.status(200).json({ success: true, data: alerts });
    } catch (err) {
      next(err);
    }
  }

  async getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { productId, warehouseId, type, page, limit } = req.query;

      const result = await inventoryService.getMovements(companyId, {
        productId: productId as string,
        warehouseId: warehouseId as string,
        type: type as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const inventoryController = new InventoryController();
