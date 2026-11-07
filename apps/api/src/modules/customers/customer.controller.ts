import { Request, Response, NextFunction } from "express";
import { prisma } from "@dreamspos/database";

export class CustomerController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const customers = await prisma.customer.findMany({
        where: { companyId },
        orderBy: { name: "asc" }
      });
      res.status(200).json({ success: true, data: customers });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { name, email, phone, address } = req.body;
      const customer = await prisma.customer.create({
        data: { companyId, name, email, phone, address }
      });
      res.status(201).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }
}

export const customerController = new CustomerController();
