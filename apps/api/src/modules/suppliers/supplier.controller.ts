import { Request, Response, NextFunction } from "express";
import { prisma } from "@dreamspos/database";

export class SupplierController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { search, page, limit } = req.query;

      const pageNum = Math.max(1, page ? parseInt(page as string, 10) : 1);
      const limitNum = Math.min(100, Math.max(1, limit ? parseInt(limit as string, 10) : 20));
      const skip = (pageNum - 1) * limitNum;

      const where: any = { companyId };
      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { email: { contains: search as string } },
          { phone: { contains: search as string } }
        ];
      }

      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            purchases: { select: { id: true, totalAmount: true } }
          },
          orderBy: { name: "asc" }
        }),
        prisma.supplier.count({ where })
      ]);

      const items = suppliers.map(s => {
        const totalPurchases = s.purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          address: s.address,
          taxNumber: s.taxNumber,
          currentBalance: Number(s.currentBalance),
          totalPurchases,
          totalOrders: s.purchases.length,
          createdAt: s.createdAt.toISOString()
        };
      });

      res.status(200).json({
        success: true,
        data: {
          items,
          meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const id = req.params.id as string;

      const supplier = await prisma.supplier.findFirst({
        where: { id, companyId },
        include: {
          purchases: {
            include: {
              items: { include: { product: true, variant: true } },
              returns: true,
              payments: true
            },
            orderBy: { createdAt: "desc" }
          },
          payments: {
            orderBy: { createdAt: "desc" }
          }
        }
      });

      if (!supplier) {
        res.status(404).json({ success: false, message: "Supplier not found" });
        return;
      }

      const totalPurchases = supplier.purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
      const totalPaid = supplier.purchases.reduce((sum, p) => sum + Number(p.paidAmount), 0);

      res.status(200).json({
        success: true,
        data: {
          id: supplier.id,
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          taxNumber: supplier.taxNumber,
          currentBalance: Number(supplier.currentBalance),
          totalPurchases,
          totalPaid,
          purchases: supplier.purchases.map(p => ({
            id: p.id,
            purchaseNumber: p.purchaseNumber,
            totalAmount: Number(p.totalAmount),
            paidAmount: Number(p.paidAmount),
            status: p.status,
            paymentStatus: p.paymentStatus,
            itemsCount: p.items.length,
            createdAt: p.createdAt.toISOString()
          })),
          payments: supplier.payments.map(py => ({
            id: py.id,
            paymentNumber: py.paymentNumber,
            amount: Number(py.amount),
            paymentMethod: py.paymentMethod,
            referenceNumber: py.referenceNumber,
            createdAt: py.createdAt.toISOString()
          }))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const { name, email, phone, address, taxNumber, openingBalance } = req.body;

      const supplier = await prisma.supplier.create({
        data: {
          companyId,
          name,
          email,
          phone,
          address,
          taxNumber,
          openingBalance: openingBalance || 0,
          currentBalance: openingBalance || 0
        }
      });

      res.status(201).json({ success: true, data: supplier });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const id = req.params.id as string;
      const { name, email, phone, address, taxNumber } = req.body;

      const supplier = await prisma.supplier.update({
        where: { id },
        data: { name, email, phone, address, taxNumber }
      });

      res.status(200).json({ success: true, data: supplier });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await prisma.supplier.delete({ where: { id } });
      res.status(200).json({ success: true, message: "Supplier deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export const supplierController = new SupplierController();
