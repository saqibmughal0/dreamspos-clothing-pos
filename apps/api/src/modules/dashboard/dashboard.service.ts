import { prisma } from "@dreamspos/database";

export class DashboardService {
  async getSummary(companyId: string, startDate?: string, endDate?: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dateFilter = (startDate && endDate) ? {
      gte: new Date(startDate),
      lte: new Date(endDate)
    } : undefined;

    const [
      salesAggregate,
      todaySalesAggregate,
      monthSalesAggregate,
      purchaseAggregate,
      expensesAggregate,
      productsCount,
      customersCount,
      variantsCount,
      lowStockCount,
      returnsAggregate
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          companyId,
          status: "COMPLETED",
          ...(dateFilter ? { createdAt: dateFilter } : {})
        },
        _sum: { totalAmount: true }
      }),
      prisma.sale.aggregate({
        where: { companyId, status: "COMPLETED", createdAt: { gte: startOfToday } },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),
      prisma.sale.aggregate({
        where: { companyId, status: "COMPLETED", createdAt: { gte: startOfMonth } },
        _sum: { totalAmount: true }
      }),
      prisma.purchase.aggregate({
        where: {
          companyId,
          status: "RECEIVED",
          ...(dateFilter ? { createdAt: dateFilter } : {})
        },
        _sum: { totalAmount: true }
      }),
      prisma.expense.aggregate({
        where: {
          companyId,
          ...(dateFilter ? { date: dateFilter } : {})
        },
        _sum: { amount: true, taxAmount: true }
      }),
      prisma.product.count({ where: { companyId, isActive: true } }),
      prisma.customer.count({ where: { companyId } }),
      prisma.productVariant.count({ where: { product: { companyId }, isActive: true } }),
      prisma.productVariant.count({
        where: {
          product: { companyId },
          isActive: true,
          stockQty: { lte: 5 }
        }
      }),
      prisma.salesReturn.aggregate({
        where: {
          companyId,
          status: "COMPLETED",
          ...(dateFilter ? { createdAt: dateFilter } : {})
        },
        _sum: { refundAmount: true }
      })
    ]);

    const totalSales = Number(salesAggregate._sum.totalAmount || 0);
    const todaySales = Number(todaySalesAggregate._sum.totalAmount || 0);
    const todayOrders = todaySalesAggregate._count.id || 0;
    const monthSales = Number(monthSalesAggregate._sum.totalAmount || 0);
    const totalPurchases = Number(purchaseAggregate._sum.totalAmount || 0);
    const totalExpenses = Number(expensesAggregate._sum.amount || 0) + Number(expensesAggregate._sum.taxAmount || 0);
    const totalRefunds = Number(returnsAggregate._sum.refundAmount || 0);

    const netSales = Math.max(0, totalSales - totalRefunds);
    const estimatedProfit = Math.max(0, netSales - totalPurchases - totalExpenses);

    return {
      totalSales,
      todaySales,
      todayOrders,
      monthSales,
      totalPurchases,
      totalExpenses,
      totalRefunds,
      netSales,
      netProfit: estimatedProfit,
      productsCount,
      variantsCount,
      customersCount,
      lowStockCount
    };
  }

  async getClothingAnalytics(companyId: string, startDate?: string, endDate?: string) {
    const dateFilter = (startDate && endDate) ? {
      gte: new Date(startDate),
      lte: new Date(endDate)
    } : undefined;

    const [sales, saleItems, products, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: {
          companyId,
          status: "COMPLETED",
          ...(dateFilter ? { createdAt: dateFilter } : {})
        },
        select: {
          id: true,
          totalAmount: true,
          createdAt: true
        },
        orderBy: { createdAt: "asc" }
      }),
      prisma.saleItem.findMany({
        where: {
          sale: {
            companyId,
            status: "COMPLETED",
            ...(dateFilter ? { createdAt: dateFilter } : {})
          }
        },
        include: {
          product: { include: { category: true } },
          variant: true
        }
      }),
      prisma.product.findMany({
        where: { companyId, isActive: true },
        include: {
          variants: { where: { isActive: true } },
          stockBalances: true
        }
      }),
      prisma.expense.findMany({
        where: {
          companyId,
          ...(dateFilter ? { date: dateFilter } : {})
        },
        select: { amount: true, taxAmount: true, date: true }
      })
    ]);

    // 1. Top Selling Articles
    const productStats: Record<string, { id: string; name: string; articleCode: string; sku: string; unitsSold: number; revenue: number; cost: number }> = {};

    for (const item of saleItems) {
      const pId = item.productId;
      if (!productStats[pId]) {
        productStats[pId] = {
          id: pId,
          name: item.product.name,
          articleCode: item.product.articleCode || item.product.sku,
          sku: item.product.sku,
          unitsSold: 0,
          revenue: 0,
          cost: 0
        };
      }
      const qty = Number(item.quantity);
      productStats[pId].unitsSold += qty;
      productStats[pId].revenue += Number(item.totalPrice);
      productStats[pId].cost += qty * Number(item.product.costPrice || 0);
    }

    const topSellingArticles = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map(p => ({
        ...p,
        revenue: Number(p.revenue.toFixed(2)),
        profit: Number((p.revenue - p.cost).toFixed(2)),
        margin: p.revenue > 0 ? Number((((p.revenue - p.cost) / p.revenue) * 100).toFixed(1)) : 0
      }));

    // 2. Garment Category Breakdown
    const categoryStats: Record<string, { category: string; unitsSold: number; revenue: number }> = {};
    for (const item of saleItems) {
      const cat = item.product.category?.name || "Apparel";
      if (!categoryStats[cat]) {
        categoryStats[cat] = { category: cat, unitsSold: 0, revenue: 0 };
      }
      categoryStats[cat].unitsSold += Number(item.quantity);
      categoryStats[cat].revenue += Number(item.totalPrice);
    }
    const categoryBreakdown = Object.values(categoryStats)
      .sort((a, b) => b.revenue - a.revenue)
      .map(c => ({
        category: c.category,
        unitsSold: c.unitsSold,
        revenue: Number(c.revenue.toFixed(2))
      }));

    // 3. Clothing Size Breakdown
    const sizeStats: Record<string, number> = {};
    for (const item of saleItems) {
      const size = item.size || item.variant?.size || "Standard";
      sizeStats[size] = (sizeStats[size] || 0) + Number(item.quantity);
    }
    const sizeBreakdown = Object.entries(sizeStats).map(([size, quantity]) => ({
      size,
      quantity
    })).sort((a, b) => b.quantity - a.quantity);

    // 4. Garment Color Breakdown
    const colorStats: Record<string, number> = {};
    for (const item of saleItems) {
      const color = item.color || item.variant?.color || "Standard";
      colorStats[color] = (colorStats[color] || 0) + Number(item.quantity);
    }
    const colorBreakdown = Object.entries(colorStats).map(([color, quantity]) => ({
      color,
      quantity
    })).sort((a, b) => b.quantity - a.quantity);

    // 5. Daily Sales Trends (Last 7 Days)
    const dailyMap: Record<string, { date: string; sales: number; orders: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      dailyMap[dateKey] = { date: dateKey, sales: 0, orders: 0 };
    }

    for (const s of sales) {
      const sDate = s.createdAt.toISOString().split("T")[0];
      if (dailyMap[sDate]) {
        dailyMap[sDate].sales += Number(s.totalAmount);
        dailyMap[sDate].orders += 1;
      }
    }
    const dailySales = Object.values(dailyMap).map(d => ({
      date: d.date,
      sales: Number(d.sales.toFixed(2)),
      orders: d.orders
    }));

    // 6. Total Inventory Valuation
    let totalStockUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;

    for (const p of products) {
      const vStock = p.variants.reduce((sum, v) => sum + Number(v.stockQty || 0), 0);
      const wStock = p.stockBalances.reduce((sum, b) => sum + Number(b.quantity || 0), 0);
      const stock = Math.max(vStock, wStock);

      const baseCostPrice = Number(p.costPrice || 0);
      const baseSellingPrice = Number(p.sellingPrice || 0);

      if (p.variants && p.variants.length > 0 && vStock > 0) {
        for (const v of p.variants) {
          const qty = Number(v.stockQty || 0);
          const vCost = Number(v.costPrice || baseCostPrice);
          const vRetail = baseSellingPrice + Number(v.priceDiff || 0);

          totalStockUnits += qty;
          totalCostValuation += qty * vCost;
          totalRetailValuation += qty * vRetail;
        }
      } else {
        const avgPriceDiff = p.variants && p.variants.length > 0
          ? p.variants.reduce((sum, v) => sum + Number(v.priceDiff || 0), 0) / p.variants.length
          : 0;
        const unitCost = baseCostPrice || Number(p.variants[0]?.costPrice || 0);
        const unitRetail = baseSellingPrice + avgPriceDiff;

        totalStockUnits += stock;
        totalCostValuation += stock * unitCost;
        totalRetailValuation += stock * unitRetail;
      }
    }

    const potentialProfit = totalRetailValuation - totalCostValuation;
    const overallMargin = totalRetailValuation > 0 ? (potentialProfit / totalRetailValuation) * 100 : 0;

    return {
      topSellingArticles,
      categoryBreakdown,
      sizeBreakdown,
      colorBreakdown,
      dailySales,
      inventoryValuation: {
        totalStockUnits,
        totalCostValuation: Number(totalCostValuation.toFixed(2)),
        totalRetailValuation: Number(totalRetailValuation.toFixed(2)),
        potentialProfit: Number(potentialProfit.toFixed(2)),
        marginPercentage: Number(overallMargin.toFixed(1))
      }
    };
  }

  async getRecentTransactions(companyId: string, limit = 5) {
    const sales = await prisma.sale.findMany({
      where: { companyId },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: { include: { product: true } } }
    });

    return sales.map(s => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      customerName: s.customer?.name || "Walk-in Customer",
      amount: Number(s.totalAmount),
      itemsCount: s.items.length,
      status: s.status,
      date: s.createdAt.toISOString()
    }));
  }
}

export const dashboardService = new DashboardService();
