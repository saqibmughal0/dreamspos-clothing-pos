import { Request, Response, NextFunction } from "express";
import { dashboardService } from "./dashboard.service";
import { posService } from "../pos/pos.service";

export class DashboardController {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const data = await dashboardService.getSummary(companyId, startDate, endDate);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getClothingAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const data = await dashboardService.getClothingAnalytics(companyId, startDate, endDate);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getRecentTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const data = await dashboardService.getRecentTransactions(companyId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { period, startDate, endDate } = req.query as { period?: string; startDate?: string; endDate?: string };
      const data = await dashboardService.getOverview(companyId, period || "1Y", startDate, endDate);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getCashRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(401).json({ success: false, message: "Unauthorized: missing company context" });
        return;
      }
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

export const dashboardController = new DashboardController();
