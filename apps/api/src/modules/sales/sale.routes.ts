import { Router } from "express";
import { saleController } from "./sale.controller";
import { quotationRouter } from "./quotation.routes";
import { authenticate } from "../../middleware/auth";

export const saleRouter = Router();

saleRouter.use(authenticate);

saleRouter.use("/quotations", quotationRouter);
saleRouter.get("/", saleController.list);
saleRouter.get("/returns", saleController.listReturns);
saleRouter.get("/:id", saleController.getById);
saleRouter.post("/returns", saleController.processReturn);
saleRouter.post("/exchange", saleController.processExchange);
