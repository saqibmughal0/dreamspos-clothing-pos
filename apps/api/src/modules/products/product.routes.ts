import { Router } from "express";
import { productController } from "./product.controller";
import { authenticate } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { ProductCreateSchema } from "@dreamspos/shared";

export const productRouter = Router();

productRouter.use(authenticate);

productRouter.get("/", productController.list);
productRouter.get("/barcode/:code", productController.findByBarcode);
productRouter.post("/", validateBody(ProductCreateSchema), productController.create);
