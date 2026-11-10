import { Request, Response, NextFunction } from "express";
import { productService } from "./product.service";

export class ProductController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { page, limit, search, categoryId, brandId, season, gender } = req.query;

      const result = await productService.list(companyId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        search: search as string,
        categoryId: categoryId as string,
        brandId: brandId as string,
        season: season as string,
        gender: gender as string
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const id = req.params.id as string;

      const product = await productService.getById(companyId, id);
      if (!product) {
        res.status(404).json({ success: false, message: "Product not found" });
        return;
      }

      res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async findByBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
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
      const companyId = req.user?.companyId || "default-company-id";
      const product = await productService.create(companyId, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const id = req.params.id as string;
      const product = await productService.update(companyId, id, req.body);
      res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const id = req.params.id as string;
      await productService.delete(companyId, id);
      res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
      next(err);
    }
  }

  async getBarcodeLabels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const productIds = req.query.productIds ? (req.query.productIds as string).split(",") : undefined;
      const labels = await productService.getBarcodeLabels(companyId, productIds);
      res.status(200).json({ success: true, data: labels });
    } catch (err) {
      next(err);
    }
  }

  async exportProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const products = await productService.exportProducts(companyId);
      res.status(200).json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  async importProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { items } = req.body;
      if (!Array.isArray(items)) {
        res.status(400).json({ success: false, message: "Items must be an array" });
        return;
      }
      const result = await productService.importProducts(companyId, items);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const productController = new ProductController();
