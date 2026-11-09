import { Router } from "express";
import { inventoryController } from "./inventory.controller";
import { authenticate } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { StockAdjustmentCreateSchema, StockTransferCreateSchema } from "@dreamspos/shared";

export const inventoryRouter = Router();

inventoryRouter.use(authenticate);

inventoryRouter.post("/adjustments", validateBody(StockAdjustmentCreateSchema), inventoryController.createAdjustment);
inventoryRouter.get("/adjustments", inventoryController.listAdjustments);

inventoryRouter.post("/transfers", validateBody(StockTransferCreateSchema), inventoryController.createTransfer);
inventoryRouter.get("/transfers", inventoryController.listTransfers);

inventoryRouter.get("/valuation", inventoryController.getValuation);
inventoryRouter.get("/low-stock", inventoryController.getLowStockAlerts);
inventoryRouter.get("/movements", inventoryController.getMovements);
