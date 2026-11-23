import { Router } from "express";
import multer from "multer";
import { productController } from "./product.controller";
import { authenticate, requireRoles } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { ProductCreateSchema, UserRole } from "@dreamspos/shared";

const uploadStorage = multer.memoryStorage();
const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export const productRouter = Router();

productRouter.use(authenticate);

productRouter.get("/", productController.list);
productRouter.get("/expired", productController.getExpired);
productRouter.get("/barcodes", productController.getBarcodeLabels);
productRouter.get("/export", productController.exportProducts);
productRouter.post("/import", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), productController.importProducts);
productRouter.post("/upload-image", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_CLERK, UserRole.WAREHOUSE_STAFF]), upload.single("image"), productController.uploadImage.bind(productController));
productRouter.get("/barcode/:code", productController.findByBarcode);
productRouter.get("/:id", productController.getById);
productRouter.post("/", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_CLERK, UserRole.WAREHOUSE_STAFF]), validateBody(ProductCreateSchema), productController.create);
productRouter.put("/:id", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_CLERK, UserRole.WAREHOUSE_STAFF]), productController.update);
productRouter.delete("/:id", requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER]), productController.delete);
