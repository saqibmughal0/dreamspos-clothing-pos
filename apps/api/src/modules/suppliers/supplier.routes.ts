import { Router } from "express";
import { supplierController } from "./supplier.controller";
import { authenticate } from "../../middleware/auth";

export const supplierRouter = Router();

supplierRouter.use(authenticate);

supplierRouter.get("/", supplierController.list);
supplierRouter.post("/", supplierController.create);
