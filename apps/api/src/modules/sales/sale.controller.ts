import { Request, Response, NextFunction } from "express";
import { prisma } from "@dreamspos/database";

export class SaleController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { channel } = req.query;

      const where: any = { companyId };
      if (channel) {
        where.channel = String(channel);
      }

      const sales = await prisma.sale.findMany({
        where,
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          cashier: true,
          items: { include: { product: true } },
          payments: true
        }
      });

      res.status(200).json({ success: true, data: sales });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;

      const sale = await prisma.sale.findFirst({
        where: { id, companyId },
        include: {
          customer: true,
          cashier: true,
          items: { include: { product: true } },
          payments: true
        }
      });

      if (!sale) {
        res.status(404).json({ success: false, message: "Sale record not found" });
        return;
      }

      res.status(200).json({ success: true, data: sale });
    } catch (err) {
      next(err);
    }
  }
}

export const saleController = new SaleController();
