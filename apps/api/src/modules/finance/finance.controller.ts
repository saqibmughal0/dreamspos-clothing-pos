import { Request, Response, NextFunction } from "express";
import { financeService } from "./finance.service";

export class FinanceController {
  async listExpenseCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const categories = await financeService.listExpenseCategories(companyId);
      res.status(200).json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  async createExpenseCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const category = await financeService.createExpenseCategory(companyId, req.body);
      res.status(201).json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  }

  async listExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { categoryId, page, limit } = req.query;

      const result = await financeService.listExpenses(companyId, {
        categoryId: categoryId as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const expense = await financeService.createExpense(companyId, req.body);
      res.status(201).json({ success: true, data: expense });
    } catch (err) {
      next(err);
    }
  }

  async listAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const accounts = await financeService.listAccounts(companyId);
      res.status(200).json({ success: true, data: accounts });
    } catch (err) {
      next(err);
    }
  }

  async createJournalEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const entry = await financeService.createJournalEntry(companyId, req.body);
      res.status(201).json({ success: true, data: entry });
    } catch (err) {
      next(err);
    }
  }

  async listJournalEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { page, limit } = req.query;

      const result = await financeService.listJournalEntries(companyId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getProfitAndLoss(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const statement = await financeService.getProfitAndLoss(companyId);
      res.status(200).json({ success: true, data: statement });
    } catch (err) {
      next(err);
    }
  }
}

export const financeController = new FinanceController();
