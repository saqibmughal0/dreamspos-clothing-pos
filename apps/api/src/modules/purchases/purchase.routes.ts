import { Router } from "express";
import { purchaseController } from "./purchase.controller";
import { authenticate } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import {
  PurchaseCreateSchema,
  PurchaseReceiveSchema,
  PurchaseReturnCreateSchema,
  SupplierPaymentCreateSchema
} from "@dreamspos/shared";

export const purchaseRouter = Router();

purchaseRouter.use(authenticate);

purchaseRouter.get("/", purchaseController.listPurchases);
purchaseRouter.post("/", validateBody(PurchaseCreateSchema), purchaseController.createPurchase);
purchaseRouter.get("/returns", purchaseController.listPurchaseReturns);
purchaseRouter.post("/returns", validateBody(PurchaseReturnCreateSchema), purchaseController.createPurchaseReturn);
purchaseRouter.post("/payments", validateBody(SupplierPaymentCreateSchema), purchaseController.recordSupplierPayment);
purchaseRouter.get("/:id", purchaseController.getPurchaseById);
purchaseRouter.post("/:id/receive", validateBody(PurchaseReceiveSchema), purchaseController.receivePurchase);
