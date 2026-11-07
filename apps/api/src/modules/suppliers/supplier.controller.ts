import { Request, Response, NextFunction } from "express";
import { prisma } from "@dreamspos/database";

export class SupplierController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const suppliers = await prisma.supplier.findMany({
        where: { companyId },
        orderBy: { name: "asc" }
      });
      res.status(200).json({ success: true, data: suppliers });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { name, email, phone, address } = req.body;
      const supplier = await prisma.supplier.create({
        data: { companyId, name, email, phone, address }
      });
      res.status(201).json({ success: true, data: supplier });
    } catch (err) {
      next(err);
    }
  }
}

export const supplierController = new SupplierController();
