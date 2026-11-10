import { Router } from "express";
import { reportsController } from "./reports.controller";
import { authenticate } from "../../middleware/auth";

export const reportsRouter = Router();

reportsRouter.use(authenticate);

reportsRouter.get("/sales", reportsController.getSalesReport);
reportsRouter.get("/returns", reportsController.getReturnsReport);
reportsRouter.get("/inventory-aging", reportsController.getInventoryAgingReport);
reportsRouter.get("/sell-through", reportsController.getSellThroughRateReport);
reportsRouter.get("/purchases", reportsController.getPurchasesReport);
reportsRouter.get("/supplier-performance", reportsController.getSupplierPerformanceReport);
reportsRouter.get("/expenses", reportsController.getExpensesReport);
reportsRouter.get("/export/:type", reportsController.exportReport);
