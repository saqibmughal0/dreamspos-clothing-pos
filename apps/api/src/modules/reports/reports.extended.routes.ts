import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@dreamspos/database";

export const reportsExtendedRouter = Router();

function getDateFilter(req: Request) {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  if (startDate && endDate) {
    return { gte: new Date(startDate), lte: new Date(endDate) };
  }
  return undefined;
}

// 1. Best Seller Report
reportsExtendedRouter.get("/best-sellers", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const storeId = req.query.storeId ? String(req.query.storeId) : undefined;
    const dateFilter = getDateFilter(req);

    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          companyId,
          status: "COMPLETED",
          ...(storeId ? { storeId } : {}),
          ...(dateFilter ? { createdAt: dateFilter } : {})
        }
      },
      include: {
        product: { include: { category: true, brand: true, variants: true, stockBalances: true } }
      }
    });

    const map = new Map<string, any>();
    for (const item of saleItems) {
      const p = item.product;
      const qty = Number(item.quantity || 0);
      const rev = Number(item.totalPrice || 0);
      if (!map.has(p.id)) {
        const vStock = p.variants.reduce((s, v) => s + Number(v.stockQty || 0), 0);
        const wStock = p.stockBalances.reduce((s, b) => s + Number(b.quantity || 0), 0);
        map.set(p.id, {
          id: p.id,
          sku: p.sku,
          productName: p.name,
          category: p.category?.name || "—",
          brand: p.brand?.name || "—",
          soldQty: 0,
          soldAmount: 0,
          instockQty: p.variants.length > 0 ? vStock : wStock
        });
      }
      const entry = map.get(p.id);
      entry.soldQty += qty;
      entry.soldAmount += rev;
    }

    const items = Array.from(map.values())
      .sort((a, b) => b.soldQty - a.soldQty || b.soldAmount - a.soldAmount);

    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

// 2. Customer Report
reportsExtendedRouter.get("/customers", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const storeId = req.query.storeId ? String(req.query.storeId) : undefined;
    const dateFilter = getDateFilter(req);

    const sales = await prisma.sale.findMany({
      where: {
        companyId,
        status: "COMPLETED",
        ...(storeId ? { storeId } : {}),
        ...(dateFilter ? { createdAt: dateFilter } : {})
      },
      include: { customer: true },
      orderBy: { createdAt: "desc" }
    });

    const custMap = new Map<string, any>();
    for (const s of sales) {
      const key = s.customerId || "walk-in";
      if (!custMap.has(key)) {
        custMap.set(key, {
          id: key,
          reference: s.invoiceNumber,
          code: s.customer?.id ? s.customer.id.slice(0, 8).toUpperCase() : "WALK-IN",
          customer: s.customer?.name || "Walk-in Customer",
          totalOrders: 0,
          amount: 0,
          paid: 0,
          due: 0,
          paymentMethod: s.paymentStatus
        });
      }
      const c = custMap.get(key);
      c.totalOrders += 1;
      c.amount += Number(s.totalAmount || 0);
      c.paid += Number(s.paidAmount || 0);
      c.due += Number(s.dueAmount || 0);
    }

    const items = Array.from(custMap.values());
    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

// 3. Customer Due Report
reportsExtendedRouter.get("/customer-due", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const storeId = req.query.storeId ? String(req.query.storeId) : undefined;
    const dateFilter = getDateFilter(req);

    const sales = await prisma.sale.findMany({
      where: {
        companyId,
        dueAmount: { gt: 0 },
        ...(storeId ? { storeId } : {}),
        ...(dateFilter ? { createdAt: dateFilter } : {})
      },
      include: { customer: true },
      orderBy: { createdAt: "desc" }
    });

    const items = sales.map(s => ({
      id: s.id,
      reference: s.invoiceNumber,
      code: s.customerId ? s.customerId.slice(0, 8).toUpperCase() : "WALK-IN",
      customer: s.customer?.name || "Walk-in Customer",
      totalAmount: Number(s.totalAmount || 0),
      paid: Number(s.paidAmount || 0),
      due: Number(s.dueAmount || 0),
      status: s.paymentStatus,
      date: s.createdAt.toISOString()
    }));

    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

// 4. Supplier Report
reportsExtendedRouter.get("/suppliers", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const dateFilter = getDateFilter(req);

    const purchases = await prisma.purchase.findMany({
      where: {
        companyId,
        ...(dateFilter ? { createdAt: dateFilter } : {})
      },
      include: { supplier: true },
      orderBy: { createdAt: "desc" }
    });

    const items = purchases.map(p => ({
      id: p.id,
      reference: p.purchaseNumber,
      supplier: p.supplier?.name || "—",
      totalItems: 0,
      amount: Number(p.totalAmount || 0),
      paid: Number(p.paidAmount || 0),
      due: Math.max(0, Number(p.totalAmount || 0) - Number(p.paidAmount || 0)),
      paymentMethod: p.paymentStatus,
      status: p.status,
      date: p.createdAt.toISOString()
    }));

    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

// 5. Supplier Due Report
reportsExtendedRouter.get("/supplier-due", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const dateFilter = getDateFilter(req);

    const purchases = await prisma.purchase.findMany({
      where: {
        companyId,
        ...(dateFilter ? { createdAt: dateFilter } : {})
      },
      include: { supplier: true },
      orderBy: { createdAt: "desc" }
    });

    const items = purchases
      .filter(p => Number(p.totalAmount || 0) > Number(p.paidAmount || 0))
      .map(p => ({
        id: p.id,
        reference: p.purchaseNumber,
        supplier: p.supplier?.name || "—",
        totalAmount: Number(p.totalAmount || 0),
        paid: Number(p.paidAmount || 0),
        due: Number(p.totalAmount || 0) - Number(p.paidAmount || 0),
        status: p.paymentStatus,
        date: p.createdAt.toISOString()
      }));

    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

// 6. Tax Report
reportsExtendedRouter.get("/tax", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const storeId = req.query.storeId ? String(req.query.storeId) : undefined;
    const dateFilter = getDateFilter(req);

    const [sales, purchases] = await Promise.all([
      prisma.sale.findMany({
        where: { companyId, status: "COMPLETED", ...(storeId ? { storeId } : {}), ...(dateFilter ? { createdAt: dateFilter } : {}) },
        include: { customer: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.purchase.findMany({
        where: { companyId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
        include: { supplier: true },
        orderBy: { createdAt: "desc" }
      })
    ]);

    const saleRows = sales.map(s => ({
      id: `s-${s.id}`,
      reference: s.invoiceNumber,
      party: s.customer?.name || "Walk-in Customer",
      date: s.createdAt.toISOString(),
      amount: Number(s.totalAmount || 0),
      taxAmount: Number(s.taxAmount || 0),
      type: "Sales Tax",
      paymentMethod: s.paymentStatus
    }));

    const purchaseRows = purchases.map(p => ({
      id: `p-${p.id}`,
      reference: p.purchaseNumber,
      party: p.supplier?.name || "Supplier",
      date: p.createdAt.toISOString(),
      amount: Number(p.totalAmount || 0),
      taxAmount: Number(p.taxAmount || 0),
      type: "Purchase Tax",
      paymentMethod: p.paymentStatus
    }));

    const items = [...saleRows, ...purchaseRows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalTax = items.reduce((s, r) => s + r.taxAmount, 0);

    res.json({ success: true, data: { items, totalTax } });
  } catch (err) { next(err); }
});

// 7. Income Report
reportsExtendedRouter.get("/income", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const dateFilter = getDateFilter(req);

    const incomes = await prisma.income.findMany({
      where: { companyId, ...(dateFilter ? { date: dateFilter } : {}) },
      include: { category: true },
      orderBy: { date: "desc" }
    });

    const items = incomes.map(i => ({
      id: i.id,
      reference: i.incomeNumber,
      date: i.date.toISOString(),
      category: i.category?.name || "—",
      paymentMethod: i.paymentMethod,
      amount: Number(i.amount || 0),
      notes: i.notes || ""
    }));
    const totalIncome = items.reduce((s, x) => s + x.amount, 0);

    res.json({ success: true, data: { items, totalIncome } });
  } catch (err) { next(err); }
});

// 8. Invoice Report
reportsExtendedRouter.get("/invoices", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const storeId = req.query.storeId ? String(req.query.storeId) : undefined;
    const dateFilter = getDateFilter(req);

    const sales = await prisma.sale.findMany({
      where: { companyId, ...(storeId ? { storeId } : {}), ...(dateFilter ? { createdAt: dateFilter } : {}) },
      include: { customer: true },
      orderBy: { createdAt: "desc" }
    });

    const items = sales.map(s => ({
      id: s.id,
      invoiceNo: s.invoiceNumber,
      customer: s.customer?.name || "Walk-in Customer",
      dueDate: s.createdAt.toISOString(),
      amount: Number(s.totalAmount || 0),
      paid: Number(s.paidAmount || 0),
      amountDue: Number(s.dueAmount || 0),
      status: s.paymentStatus
    }));

    const summary = {
      totalAmount: items.reduce((s, x) => s + x.amount, 0),
      totalPaid: items.reduce((s, x) => s + x.paid, 0),
      totalDue: items.reduce((s, x) => s + x.amountDue, 0)
    };

    res.json({ success: true, data: { items, summary } });
  } catch (err) { next(err); }
});

// 9. Sold Stock Report
reportsExtendedRouter.get("/sold-stock", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const storeId = req.query.storeId ? String(req.query.storeId) : undefined;
    const dateFilter = getDateFilter(req);

    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          companyId,
          status: "COMPLETED",
          ...(storeId ? { storeId } : {}),
          ...(dateFilter ? { createdAt: dateFilter } : {})
        }
      },
      include: {
        product: { include: { category: true, variants: true, stockBalances: true } }
      }
    });

    const map = new Map<string, any>();
    for (const item of saleItems) {
      const p = item.product;
      const qty = Number(item.quantity || 0);
      const rev = Number(item.totalPrice || 0);
      if (!map.has(p.id)) {
        const vStock = p.variants.reduce((s, v) => s + Number(v.stockQty || 0), 0);
        const wStock = p.stockBalances.reduce((s, b) => s + Number(b.quantity || 0), 0);
        map.set(p.id, {
          id: p.id,
          sku: p.sku,
          productName: p.name,
          unitCost: Number(p.costPrice || 0),
          quantity: 0,
          taxValue: 0,
          total: 0,
          instock: p.variants.length > 0 ? vStock : wStock
        });
      }
      const row = map.get(p.id);
      row.quantity += qty;
      row.taxValue += Number(item.taxAmount || 0);
      row.total += rev;
    }

    res.json({ success: true, data: { items: Array.from(map.values()) } });
  } catch (err) { next(err); }
});

// 10. Stock History Report
reportsExtendedRouter.get("/stock-history", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const dateFilter = getDateFilter(req);

    const movements = await prisma.stockMovement.findMany({
      where: {
        product: { companyId },
        ...(dateFilter ? { createdAt: dateFilter } : {})
      },
      include: { product: true, warehouse: true },
      orderBy: { createdAt: "desc" },
      take: 200
    });

    const items = movements.map(m => ({
      id: m.id,
      sku: m.product?.sku || "—",
      productName: m.product?.name || "—",
      warehouse: m.warehouse?.name || "—",
      type: m.type,
      quantity: Number(m.quantity || 0),
      reference: m.referenceId || m.notes || "—",
      date: m.createdAt.toISOString()
    }));

    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

// 11. Product Report
reportsExtendedRouter.get("/products", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const products = await prisma.product.findMany({
      where: { companyId, isActive: true },
      include: { category: true, brand: true, variants: true, stockBalances: true, saleItems: true },
      orderBy: { name: "asc" }
    });

    const items = products.map(p => {
      const vStock = p.variants.reduce((s, v) => s + Number(v.stockQty || 0), 0);
      const wStock = p.stockBalances.reduce((s, b) => s + Number(b.quantity || 0), 0);
      const soldQty = p.saleItems.reduce((s, i) => s + Number(i.quantity || 0), 0);
      const revenue = p.saleItems.reduce((s, i) => s + Number(i.totalPrice || 0), 0);
      return {
        id: p.id,
        sku: p.sku,
        productName: p.name,
        category: p.category?.name || "—",
        brand: p.brand?.name || "—",
        qty: p.variants.length > 0 ? vStock : wStock,
        price: Number(p.sellingPrice || 0),
        soldQty,
        revenue
      };
    });

    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

// 12. Product Expired Report
reportsExtendedRouter.get("/product-expired", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const products = await prisma.product.findMany({
      where: { companyId, isActive: true, expiryDate: { not: null } },
      orderBy: { expiryDate: "asc" }
    });

    const items = products.map(p => ({
      id: p.id,
      sku: p.sku,
      productName: p.name,
      manufacturedDate: p.manufacturedDate ? p.manufacturedDate.toISOString() : null,
      expiryDate: p.expiryDate ? p.expiryDate.toISOString() : null,
      isExpired: p.expiryDate ? p.expiryDate <= new Date() : false
    }));

    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

// 13. Product Quality / Quantity Alert Report
reportsExtendedRouter.get("/product-quality", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId;
    const products = await prisma.product.findMany({
      where: { companyId, isActive: true },
      include: { category: true, variants: true, stockBalances: true },
      orderBy: { name: "asc" }
    });

    const items = products.map(p => {
      const vStock = p.variants.reduce((s, v) => s + Number(v.stockQty || 0), 0);
      const wStock = p.stockBalances.reduce((s, b) => s + Number(b.quantity || 0), 0);
      const qty = p.variants.length > 0 ? vStock : wStock;
      const alertQty = Number(p.alertQuantity ?? 5);
      return {
        id: p.id,
        sku: p.sku,
        productName: p.name,
        category: p.category?.name || "—",
        qty,
        alertQuantity: alertQty,
        status: qty <= 0 ? "Out of Stock" : qty <= alertQty ? "Low Stock" : "Healthy"
      };
    });

    res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});
