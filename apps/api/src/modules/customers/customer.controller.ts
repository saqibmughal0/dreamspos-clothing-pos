import { Request, Response, NextFunction } from "express";
import { prisma } from "@dreamspos/database";

export class CustomerController {
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

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            sales: { select: { id: true, totalAmount: true } }
          },
          orderBy: { name: "asc" }
        }),
        prisma.customer.count({ where })
      ]);

      const items = customers.map(c => {
        const totalPurchases = c.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
        return {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          taxNumber: c.taxNumber,
          loyaltyPoints: c.loyaltyPoints,
          loyaltyTier: c.loyaltyTier,
          creditLimit: Number(c.creditLimit),
          currentBalance: Number(c.currentBalance),
          totalPurchases,
          totalOrders: c.sales.length,
          createdAt: c.createdAt.toISOString()
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

      const customer = await prisma.customer.findFirst({
        where: { id, companyId },
        include: {
          sales: {
            include: {
              items: { include: { product: true, variant: true } },
              returns: true,
              payments: true
            },
            orderBy: { createdAt: "desc" },
            take: 20
          }
        }
      });

      if (!customer) {
        res.status(404).json({ success: false, message: "Customer not found" });
        return;
      }

      const totalPurchases = customer.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
      const totalPaid = customer.sales.reduce((sum, s) => sum + Number(s.paidAmount), 0);
      const outstandingBalance = totalPurchases - totalPaid;

      res.status(200).json({
        success: true,
        data: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          taxNumber: customer.taxNumber,
          loyaltyPoints: customer.loyaltyPoints,
          loyaltyTier: customer.loyaltyTier,
          creditLimit: Number(customer.creditLimit),
          currentBalance: Number(customer.currentBalance),
          totalPurchases,
          totalPaid,
          outstandingBalance,
          salesHistory: customer.sales.map(s => ({
            id: s.id,
            invoiceNumber: s.invoiceNumber,
            totalAmount: Number(s.totalAmount),
            paidAmount: Number(s.paidAmount),
            dueAmount: Number(s.dueAmount),
            status: s.status,
            paymentStatus: s.paymentStatus,
            itemsCount: s.items.length,
            returnsCount: s.returns.length,
            createdAt: s.createdAt.toISOString()
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
      const { name, email, phone, address, taxNumber, creditLimit, openingBalance } = req.body;

      const customer = await prisma.customer.create({
        data: {
          companyId,
          name,
          email,
          phone,
          address,
          taxNumber,
          creditLimit: creditLimit || 0,
          openingBalance: openingBalance || 0,
          currentBalance: openingBalance || 0,
          loyaltyPoints: 0,
          loyaltyTier: "BRONZE"
        }
      });

      res.status(201).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId || "default-company-id";
      const id = req.params.id as string;
      const { name, email, phone, address, taxNumber, creditLimit, loyaltyPoints, loyaltyTier } = req.body;

      const customer = await prisma.customer.update({
        where: { id },
        data: {
          name,
          email,
          phone,
          address,
          taxNumber,
          creditLimit,
          loyaltyPoints,
          loyaltyTier
        }
      });

      res.status(200).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await prisma.customer.delete({ where: { id } });
      res.status(200).json({ success: true, message: "Customer deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export const customerController = new CustomerController();
