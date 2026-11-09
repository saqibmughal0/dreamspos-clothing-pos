import { Request, Response, NextFunction } from "express";
import { reportsService } from "./reports.service";

export class ReportsController {
  async getSalesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { startDate, endDate, cashierId, page, limit } = req.query;

      const report = await reportsService.getSalesReport(companyId, {
        startDate: startDate as string,
        endDate: endDate as string,
        cashierId: cashierId as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20
      });

      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async getReturnsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { startDate, endDate, page, limit } = req.query;

      const report = await reportsService.getReturnsReport(companyId, {
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20
      });

      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async getInventoryAgingReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const report = await reportsService.getInventoryAgingReport(companyId);
      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async getSellThroughRateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const report = await reportsService.getSellThroughRateReport(companyId);
      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async getPurchasesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { startDate, endDate, supplierId, page, limit } = req.query;

      const report = await reportsService.getPurchasesReport(companyId, {
        startDate: startDate as string,
        endDate: endDate as string,
        supplierId: supplierId as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20
      });

      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async getSupplierPerformanceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const report = await reportsService.getSupplierPerformanceReport(companyId);
      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async getExpensesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { startDate, endDate, categoryId, page, limit } = req.query;

      const report = await reportsService.getExpensesReport(companyId, {
        startDate: startDate as string,
        endDate: endDate as string,
        categoryId: categoryId as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20
      });

      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const type = String(req.params.type);

      const csvContent = await reportsService.exportReport(companyId, type);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${type}-report-${Date.now()}.csv"`);
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }
}

export const reportsController = new ReportsController();
