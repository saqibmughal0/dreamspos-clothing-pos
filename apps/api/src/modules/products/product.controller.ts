import { Request, Response, NextFunction } from "express";
import { productService } from "./product.service";

export class ProductController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { page, limit, search, categoryId, brandId } = req.query;

      const result = await productService.list(companyId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        search: search as string,
        categoryId: categoryId as string,
        brandId: brandId as string
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async findByBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const code = req.params.code as string;

      const product = await productService.findByBarcode(companyId, code);
      if (!product) {
        res.status(404).json({ success: false, message: "Product not found" });
        return;
      }

      res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const product = await productService.create(companyId, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
}

export const productController = new ProductController();
