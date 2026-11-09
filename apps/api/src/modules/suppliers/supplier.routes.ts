import { Router } from "express";
import { supplierController } from "./supplier.controller";
import { authenticate } from "../../middleware/auth";

export const supplierRouter = Router();

supplierRouter.use(authenticate);

supplierRouter.get("/", supplierController.list);
supplierRouter.get("/:id", supplierController.getById);
supplierRouter.post("/", supplierController.create);
supplierRouter.put("/:id", supplierController.update);
supplierRouter.delete("/:id", supplierController.delete);
