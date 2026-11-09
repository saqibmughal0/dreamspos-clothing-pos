import { Router } from "express";
import { dashboardController } from "./dashboard.controller";
import { authenticate } from "../../middleware/auth";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get("/summary", dashboardController.getSummary);
dashboardRouter.get("/analytics", dashboardController.getClothingAnalytics);
dashboardRouter.get("/transactions", dashboardController.getRecentTransactions);
