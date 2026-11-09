import { Request, Response, NextFunction } from "express";
import { settingsService } from "./settings.service";

export class SettingsController {
  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const settings = await settingsService.getSettings(companyId);
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const updated = await settingsService.updateSettings(companyId, req.body);
      res.status(200).json({ success: true, data: updated, message: "Settings updated successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export const settingsController = new SettingsController();
