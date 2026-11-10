import { prisma } from "@dreamspos/database";

export class ReportsService {
  /**
   * 1. Sales Report with Date Range, Cashier, Payment Method Filters & Pagination
   */
  async getSalesReport(companyId: string, options: {
    startDate?: string;
    endDate?: string;
    cashierId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { companyId, status: "COMPLETED" };
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = new Date(options.startDate);
      if (options.endDate) where.createdAt.lte = new Date(options.endDate);
    }
    if (options.cashierId) where.cashierId = options.cashierId;

    const [sales, total, aggregate] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          cashier: true,
          payments: true,
          items: {
            include: { product: true, variant: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.sale.count({ where }),
      prisma.sale.aggregate({
        where,
        _sum: {
          subtotal: true,
          discountAmount: true,
          taxAmount: true,
          totalAmount: true,
          paidAmount: true
        }
      })
    ]);

    return {
      summary: {
        totalSales: Number(aggregate._sum.totalAmount || 0),
        totalDiscount: Number(aggregate._sum.discountAmount || 0),
        totalTax: Number(aggregate._sum.taxAmount || 0),
        ordersCount: total
      },
      items: sales.map(s => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        customerName: s.customer?.name || "Walk-in Customer",
        cashierName: s.cashier.name,
        paymentMethods: s.payments.map(p => p.method).join(", "),
        subtotal: Number(s.subtotal),
        discountAmount: Number(s.discountAmount),
        taxAmount: Number(s.taxAmount),
        totalAmount: Number(s.totalAmount),
        paidAmount: Number(s.paidAmount),
        itemsCount: s.items.length,
        createdAt: s.createdAt.toISOString()
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 2. Returns and Exchanges Report
   */
  async getReturnsReport(companyId: string, options: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = new Date(options.startDate);
      if (options.endDate) where.createdAt.lte = new Date(options.endDate);
    }

    const [returns, total, aggregate] = await Promise.all([
      prisma.salesReturn.findMany({
        where,
        skip,
        take: limit,
        include: {
          sale: { include: { customer: true } },
          items: { include: { product: true } }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.salesReturn.count({ where }),
      prisma.salesReturn.aggregate({
        where,
        _sum: { refundAmount: true }
      })
    ]);

    return {
      summary: {
        totalRefundAmount: Number(aggregate._sum.refundAmount || 0),
        returnsCount: total
      },
      items: returns.map(r => ({
        id: r.id,
        returnNumber: r.returnNumber,
        invoiceNumber: r.sale.invoiceNumber,
        customerName: r.sale.customer?.name || "Walk-in Customer",
        refundAmount: Number(r.refundAmount),
        refundMethod: r.refundMethod,
        reason: r.reason,
        itemsCount: r.items.length,
        createdAt: r.createdAt.toISOString()
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 3. Inventory Aging Report
   * Groups clothing products into aging buckets (0-30 days, 31-60 days, 61-90 days, 90+ days)
   */
  async getInventoryAgingReport(companyId: string) {
    const products = await prisma.product.findMany({
      where: { companyId, isActive: true },
      include: {
        category: true,
        variants: { where: { isActive: true } },
        stockBalances: true
      }
    });

    const now = new Date();
    const buckets = {
      under30Days: { count: 0, units: 0, costValue: 0 },
      days31to60: { count: 0, units: 0, costValue: 0 },
      days61to90: { count: 0, units: 0, costValue: 0 },
      over90Days: { count: 0, units: 0, costValue: 0 }
    };

    const items = products.map(p => {
      const vStock = p.variants.reduce((sum, v) => sum + Number(v.stockQty), 0);
      const wStock = p.stockBalances.reduce((sum, b) => sum + Number(b.quantity), 0);
      const units = Math.max(vStock, wStock);

      const daysOld = Math.floor((now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const costValue = units * Number(p.costPrice);

      let bucketName = "0-30 days";
      if (daysOld <= 30) {
        buckets.under30Days.count++;
        buckets.under30Days.units += units;
        buckets.under30Days.costValue += costValue;
        bucketName = "0-30 days";
      } else if (daysOld <= 60) {
        buckets.days31to60.count++;
        buckets.days31to60.units += units;
        buckets.days31to60.costValue += costValue;
        bucketName = "31-60 days";
      } else if (daysOld <= 90) {
        buckets.days61to90.count++;
        buckets.days61to90.units += units;
        buckets.days61to90.costValue += costValue;
        bucketName = "61-90 days";
      } else {
        buckets.over90Days.count++;
        buckets.over90Days.units += units;
        buckets.over90Days.costValue += costValue;
        bucketName = "90+ days (Stagnant)";
      }

      return {
        id: p.id,
        name: p.name,
        articleCode: p.articleCode || p.sku,
        category: p.category.name,
        season: p.season || "SS26",
        units,
        costPrice: Number(p.costPrice),
        sellingPrice: Number(p.sellingPrice),
        costValue: Number(costValue.toFixed(2)),
        daysOld,
        bucket: bucketName
      };
    });

    return {
      summary: buckets,
      items: items.sort((a, b) => b.daysOld - a.daysOld)
    };
  }

  /**
   * 4. Sell-Through Rate Report
   * Essential retail metric: % of inventory sold vs total inventory received
   */
  async getSellThroughRateReport(companyId: string) {
    const products = await prisma.product.findMany({
      where: { companyId, isActive: true },
      include: {
        category: true,
        variants: { where: { isActive: true } },
        saleItems: { select: { quantity: true } }
      }
    });

    const report = products.map(p => {
      const unitsSold = p.saleItems.reduce((acc, si) => acc + Number(si.quantity), 0);
      const remainingStock = p.variants.reduce((acc, v) => acc + Number(v.stockQty), 0);
      const totalInventory = unitsSold + remainingStock;

      const sellThroughRate = totalInventory > 0 ? (unitsSold / totalInventory) * 100 : 0;

      let velocity = "High";
      if (sellThroughRate < 30) velocity = "Slow Mover";
      else if (sellThroughRate < 60) velocity = "Steady";

      return {
        id: p.id,
        name: p.name,
        articleCode: p.articleCode || p.sku,
        category: p.category.name,
        season: p.season || "SS26",
        unitsSold,
        remainingStock,
        totalInventory,
        sellThroughRate: Number(sellThroughRate.toFixed(1)),
        velocity
      };
    });

    return report.sort((a, b) => b.sellThroughRate - a.sellThroughRate);
  }

  /**
   * 5. Purchases Report
   */
  async getPurchasesReport(companyId: string, options: {
    startDate?: string;
    endDate?: string;
    supplierId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = new Date(options.startDate);
      if (options.endDate) where.createdAt.lte = new Date(options.endDate);
    }
    if (options.supplierId) where.supplierId = options.supplierId;

    const [purchases, total, aggregate] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        include: { supplier: true, warehouse: true, items: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.purchase.count({ where }),
      prisma.purchase.aggregate({
        where,
        _sum: { totalAmount: true, paidAmount: true }
      })
    ]);

    const totalSpend = Number(aggregate._sum.totalAmount || 0);
    const totalPaid = Number(aggregate._sum.paidAmount || 0);
    const totalDue = totalSpend - totalPaid;

    return {
      summary: {
        totalSpend,
        totalPaid,
        totalDue,
        purchasesCount: total
      },
      items: purchases.map(p => ({
        id: p.id,
        purchaseNumber: p.purchaseNumber,
        supplierName: p.supplier.name,
        warehouseName: p.warehouse.name,
        totalAmount: Number(p.totalAmount),
        paidAmount: Number(p.paidAmount),
        status: p.status,
        paymentStatus: p.paymentStatus,
        createdAt: p.createdAt.toISOString()
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 6. Supplier Performance Report
   */
  async getSupplierPerformanceReport(companyId: string) {
    const suppliers = await prisma.supplier.findMany({
      where: { companyId },
      include: {
        purchases: {
          include: { items: true, returns: true }
        },
        returns: true
      }
    });

    return suppliers.map(s => {
      let totalOrderedQty = 0;
      let totalReceivedQty = 0;
      let totalPurchaseSpend = 0;

      for (const p of s.purchases) {
        totalPurchaseSpend += Number(p.totalAmount);
        for (const item of p.items) {
          totalOrderedQty += Number(item.quantity);
          totalReceivedQty += Number(item.receivedQty);
        }
      }

      const totalReturnsAmount = s.returns.reduce((sum, r) => sum + Number(r.refundAmount), 0);
      const fulfillmentRate = totalOrderedQty > 0 ? (totalReceivedQty / totalOrderedQty) * 100 : 100;
      const defectRate = totalPurchaseSpend > 0 ? (totalReturnsAmount / totalPurchaseSpend) * 100 : 0;

      return {
        id: s.id,
        supplierName: s.name,
        email: s.email,
        phone: s.phone,
        totalOrders: s.purchases.length,
        totalSpend: Number(totalPurchaseSpend.toFixed(2)),
        currentBalance: Number(s.currentBalance),
        totalReturnsAmount: Number(totalReturnsAmount.toFixed(2)),
        fulfillmentRate: Number(fulfillmentRate.toFixed(1)),
        defectReturnRate: Number(defectRate.toFixed(1)),
        rating: defectRate < 2 ? "A+ Preferred" : defectRate < 5 ? "B Standard" : "Under Review"
      };
    });
  }

  /**
   * 7. Operating Expenses Report
   */
  async getExpensesReport(companyId: string, options: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (options.startDate || options.endDate) {
      where.date = {};
      if (options.startDate) where.date.gte = new Date(options.startDate);
      if (options.endDate) where.date.lte = new Date(options.endDate);
    }
    if (options.categoryId) where.categoryId = options.categoryId;

    const [expenses, total, aggregate] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        include: { category: true },
        orderBy: { date: "desc" }
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true, taxAmount: true }
      })
    ]);

    const totalAmount = Number(aggregate._sum.amount || 0) + Number(aggregate._sum.taxAmount || 0);

    return {
      summary: {
        totalExpenses: totalAmount,
        expenseCount: total
      },
      items: expenses.map(e => ({
        id: e.id,
        expenseNumber: e.expenseNumber,
        categoryName: e.category.name,
        amount: Number(e.amount),
        taxAmount: Number(e.taxAmount),
        paymentMethod: e.paymentMethod,
        date: e.date.toISOString(),
        notes: e.notes
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 8. Export Report to CSV / JSON
   */
  async exportReport(companyId: string, reportType: string): Promise<string> {
    if (reportType === "sales") {
      const data = await this.getSalesReport(companyId, { limit: 1000 });
      const headers = "Invoice Number,Customer,Cashier,Payment Method,Subtotal,Discount,Tax,Total,Date\n";
      const rows = data.items.map(i =>
        `"${i.invoiceNumber}","${i.customerName}","${i.cashierName}","${i.paymentMethods}",${i.subtotal},${i.discountAmount},${i.taxAmount},${i.totalAmount},"${i.createdAt}"`
      ).join("\n");
      return headers + rows;
    }

    if (reportType === "inventory-aging") {
      const data = await this.getInventoryAgingReport(companyId);
      const headers = "Article Code,Name,Category,Season,Units,Cost Price,Selling Price,Cost Value,Days Old,Bucket\n";
      const rows = data.items.map(i =>
        `"${i.articleCode}","${i.name}","${i.category}","${i.season}",${i.units},${i.costPrice},${i.sellingPrice},${i.costValue},${i.daysOld},"${i.bucket}"`
      ).join("\n");
      return headers + rows;
    }

    if (reportType === "sell-through") {
      const data = await this.getSellThroughRateReport(companyId);
      const headers = "Article Code,Name,Category,Season,Units Sold,Remaining Stock,Total Inventory,Sell-Through %,Velocity\n";
      const rows = data.map(i =>
        `"${i.articleCode}","${i.name}","${i.category}","${i.season}",${i.unitsSold},${i.remainingStock},${i.totalInventory},${i.sellThroughRate}%,"${i.velocity}"`
      ).join("\n");
      return headers + rows;
    }

    throw new Error(`Unsupported report type for export: ${reportType}`);
  }
}

export const reportsService = new ReportsService();
