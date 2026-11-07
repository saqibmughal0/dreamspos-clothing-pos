import { Router } from "express";
import { posController } from "./pos.controller";
import { authenticate } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { PosCheckoutSchema } from "@dreamspos/shared";

export const posRouter = Router();

posRouter.use(authenticate);

posRouter.post("/checkout", validateBody(PosCheckoutSchema), posController.checkout);
posRouter.get("/orders", posController.getRecentOrders);
