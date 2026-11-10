import { Request, Response, NextFunction } from "express";
import { purchaseService } from "./purchase.service";

export class PurchaseController {
  async listPurchases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { supplierId, status, page, limit } = req.query;

      const result = await purchaseService.listPurchases(companyId, {
        supplierId: supplierId as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getPurchaseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const id = req.params.id as string;

      const purchase = await purchaseService.getPurchaseById(companyId, id);
      if (!purchase) {
        res.status(404).json({ success: false, message: "Purchase order not found" });
        return;
      }

      res.status(200).json({ success: true, data: purchase });
    } catch (err) {
      next(err);
    }
  }

  async createPurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const purchase = await purchaseService.createPurchase(companyId, req.body);
      res.status(201).json({ success: true, data: purchase });
    } catch (err) {
      next(err);
    }
  }

  async receivePurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const id = req.params.id as string;
      const result = await purchaseService.receivePurchase(companyId, id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async createPurchaseReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const purchaseReturn = await purchaseService.createPurchaseReturn(companyId, req.body);
      res.status(201).json({ success: true, data: purchaseReturn });
    } catch (err) {
      next(err);
    }
  }

  async listPurchaseReturns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { page, limit } = req.query;

      const result = await purchaseService.listPurchaseReturns(companyId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async recordSupplierPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const payment = await purchaseService.recordSupplierPayment(companyId, req.body);
      res.status(201).json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  }
}

export const purchaseController = new PurchaseController();
