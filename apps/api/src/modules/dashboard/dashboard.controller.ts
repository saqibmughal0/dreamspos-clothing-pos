import { Request, Response, NextFunction } from "express";
import { dashboardService } from "./dashboard.service";

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
}

export const dashboardController = new DashboardController();
