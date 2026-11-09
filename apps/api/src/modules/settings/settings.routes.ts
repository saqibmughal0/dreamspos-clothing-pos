import { Router } from "express";
import { settingsController } from "./settings.controller";
import { authenticate, requireRoles } from "../../middleware/auth";
import { UserRole } from "@dreamspos/shared";

export const settingsRouter = Router();

settingsRouter.use(authenticate);

settingsRouter.get("/", settingsController.getSettings);
settingsRouter.put("/", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN]), settingsController.updateSettings);
