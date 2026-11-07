import { Router } from "express";
import { saleController } from "./sale.controller";
import { authenticate } from "../../middleware/auth";

export const saleRouter = Router();

saleRouter.use(authenticate);

saleRouter.get("/", saleController.list);
saleRouter.get("/:id", saleController.getById);
