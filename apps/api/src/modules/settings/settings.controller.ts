import { Request, Response, NextFunction } from "express";
import { settingsService, SettingsValidationError } from "./settings.service";

export class SettingsController {
  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(401).json({ success: false, message: "Unauthorized: missing company context" });
        return;
      }
      const settings = await settingsService.getSettings(companyId);
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(401).json({ success: false, message: "Unauthorized: missing company context" });
        return;
      }
      const updated = await settingsService.updateSettings(companyId, req.body);
      res.status(200).json({ success: true, data: updated, message: "Settings updated successfully" });
    } catch (err) {
      if (err instanceof SettingsValidationError) {
        res.status(400).json({ success: false, message: err.message });
        return;
      }
      next(err);
    }
  }
}

export const settingsController = new SettingsController();
