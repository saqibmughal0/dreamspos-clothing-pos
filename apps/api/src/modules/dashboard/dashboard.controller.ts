import { Request, Response, NextFunction } from "express";
import { dashboardService } from "./dashboard.service";

export class DashboardController {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const data = await dashboardService.getSummary(companyId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getRecentTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const data = await dashboardService.getRecentTransactions(companyId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
