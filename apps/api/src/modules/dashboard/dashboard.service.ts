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

  async getOverview(companyId: string, period = "1Y", startDate?: string, endDate?: string) {
    const now = new Date();
    let rangeEnd = endDate ? new Date(endDate) : new Date(now);
    let rangeStart: Date;

    if (startDate && endDate) {
      rangeStart = new Date(startDate);
    } else {
      switch (period) {
        case "1D":
          rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          break;
        case "1W":
          rangeStart = new Date(now);
          rangeStart.setDate(rangeStart.getDate() - 6);
          rangeStart.setHours(0, 0, 0, 0);
          break;
        case "1M":
          rangeStart = new Date(now);
          rangeStart.setDate(rangeStart.getDate() - 29);
          rangeStart.setHours(0, 0, 0, 0);
          break;
        case "3M":
          rangeStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          break;
        case "6M":
          rangeStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          break;
        case "1Y":
        default:
          rangeStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
          break;
      }
    }

    const spanMs = Math.max(1, rangeEnd.getTime() - rangeStart.getTime());
    const prevEnd = new Date(rangeStart.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - spanMs);

    const calcPct = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    const [
      currentSales,
      prevSales,
      currentSalesReturns,
      prevSalesReturns,
      currentPurchases,
      prevPurchases,
      currentPurchaseReturns,
      prevPurchaseReturns,
      currentExpenses,
      prevExpenses,
      suppliersCount,
      customersCount,
      categoriesCount,
      productsCount,
      productsWithStock,
      recentSalesList,
      recentPurchasesList,
      recentExpensesList
    ] = await Promise.all([
      prisma.sale.findMany({
        where: { companyId, status: "COMPLETED", createdAt: { gte: rangeStart, lte: rangeEnd } },
        include: {
          customer: true,
          items: { include: { product: { include: { category: true } } } }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.sale.aggregate({
        where: { companyId, status: "COMPLETED", createdAt: { gte: prevStart, lte: prevEnd } },
        _sum: { totalAmount: true, dueAmount: true }
      }),
      prisma.salesReturn.aggregate({
        where: { companyId, status: "COMPLETED", createdAt: { gte: rangeStart, lte: rangeEnd } },
        _sum: { refundAmount: true }
      }),
      prisma.salesReturn.aggregate({
        where: { companyId, status: "COMPLETED", createdAt: { gte: prevStart, lte: prevEnd } },
        _sum: { refundAmount: true }
      }),
      prisma.purchase.findMany({
        where: { companyId, status: "RECEIVED", createdAt: { gte: rangeStart, lte: rangeEnd } },
        include: { supplier: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.purchase.aggregate({
        where: { companyId, status: "RECEIVED", createdAt: { gte: prevStart, lte: prevEnd } },
        _sum: { totalAmount: true }
      }),
      prisma.purchaseReturn.aggregate({
        where: { companyId, status: "COMPLETED", createdAt: { gte: rangeStart, lte: rangeEnd } },
        _sum: { refundAmount: true }
      }),
      prisma.purchaseReturn.aggregate({
        where: { companyId, status: "COMPLETED", createdAt: { gte: prevStart, lte: prevEnd } },
        _sum: { refundAmount: true }
      }),
      prisma.expense.findMany({
        where: { companyId, date: { gte: rangeStart, lte: rangeEnd } },
        include: { category: true },
        orderBy: { date: "desc" }
      }),
      prisma.expense.aggregate({
        where: { companyId, date: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true, taxAmount: true }
      }),
      prisma.supplier.count({ where: { companyId } }),
      prisma.customer.count({ where: { companyId } }),
      prisma.category.count(),
      prisma.product.count({ where: { companyId, isActive: true } }),
      prisma.product.findMany({
        where: { companyId, isActive: true },
        include: {
          variants: { where: { isActive: true } },
          stockBalances: true
        }
      }),
      prisma.sale.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true, items: { include: { product: { include: { category: true } } } } }
      }),
      prisma.purchase.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { supplier: true }
      }),
      prisma.expense.findMany({
        where: { companyId },
        take: 5,
        orderBy: { date: "desc" },
        include: { category: true }
      })
    ]);

    const totalSales = currentSales.reduce((s, x) => s + Number(x.totalAmount || 0), 0);
    const invoiceDue = currentSales.reduce((s, x) => s + Number(x.dueAmount || 0), 0);
    const totalSalesReturns = Number(currentSalesReturns._sum.refundAmount || 0);
    const totalPurchases = currentPurchases.reduce((s, x) => s + Number(x.totalAmount || 0), 0);
    const paymentReturns = Number(currentPurchaseReturns._sum.refundAmount || 0);
    const totalExpenses = currentExpenses.reduce((s, x) => s + Number(x.amount || 0) + Number(x.taxAmount || 0), 0);
    const netSales = Math.max(0, totalSales - totalSalesReturns);
    const profit = netSales - totalPurchases - totalExpenses;

    const prevSalesVal = Number(prevSales._sum.totalAmount || 0);
    const prevInvoiceDueVal = Number(prevSales._sum.dueAmount || 0);
    const prevSalesReturnsVal = Number(prevSalesReturns._sum.refundAmount || 0);
    const prevPurchasesVal = Number(prevPurchases._sum.totalAmount || 0);
    const prevPaymentReturnsVal = Number(prevPurchaseReturns._sum.refundAmount || 0);
    const prevExpensesVal = Number(prevExpenses._sum.amount || 0) + Number(prevExpenses._sum.taxAmount || 0);
    const prevProfitVal = Math.max(0, prevSalesVal - prevSalesReturnsVal) - prevPurchasesVal - prevExpensesVal;

    // Build time-series buckets for Sales & Purchase + Sales Statistics
    const spanDays = spanMs / (1000 * 60 * 60 * 24);
    const bucketKeys: string[] = [];
    const bucketLabels: string[] = [];
    const salesBuckets: Record<string, number> = {};
    const purchaseBuckets: Record<string, number> = {};
    const expenseBuckets: Record<string, number> = {};

    const getBucketKey = (d: Date): string => {
      if (period === "1D" || spanDays <= 2) {
        const slot = Math.min(11, Math.floor(d.getHours() / 2));
        return `H${slot}`;
      }
      if (spanDays <= 35) {
        return d.toISOString().split("T")[0];
      }
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };

    if (period === "1D" || spanDays <= 2) {
      const labels = ["2 am", "4 am", "6 am", "8 am", "10 am", "12 pm", "2 pm", "4 pm", "6 pm", "8 pm", "10 pm", "12 am"];
      for (let i = 0; i < 12; i++) {
        const key = `H${i}`;
        bucketKeys.push(key);
        bucketLabels.push(labels[i]);
        salesBuckets[key] = 0;
        purchaseBuckets[key] = 0;
        expenseBuckets[key] = 0;
      }
    } else if (spanDays <= 35) {
      const daysCount = Math.max(1, Math.min(31, Math.ceil(spanDays)));
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(rangeEnd);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        bucketKeys.push(key);
        bucketLabels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
        salesBuckets[key] = 0;
        purchaseBuckets[key] = 0;
        expenseBuckets[key] = 0;
      }
    } else {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
      const endMonth = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);
      while (cursor <= endMonth && bucketKeys.length < 24) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        bucketKeys.push(key);
        bucketLabels.push(monthNames[cursor.getMonth()]);
        salesBuckets[key] = 0;
        purchaseBuckets[key] = 0;
        expenseBuckets[key] = 0;
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    for (const s of currentSales) {
      const k = getBucketKey(s.createdAt);
      if (salesBuckets[k] !== undefined) salesBuckets[k] += Number(s.totalAmount || 0);
    }
    for (const p of currentPurchases) {
      const k = getBucketKey(p.createdAt);
      if (purchaseBuckets[k] !== undefined) purchaseBuckets[k] += Number(p.totalAmount || 0);
    }
    for (const e of currentExpenses) {
      const k = getBucketKey(e.date);
      if (expenseBuckets[k] !== undefined) expenseBuckets[k] += Number(e.amount || 0) + Number(e.taxAmount || 0);
    }

    // Top Selling Products & Top Categories & Top Customers & Customers Overview
    const prodMap: Record<string, { id: string; name: string; image: string; price: number; unitsSold: number; revenue: number }> = {};
    const catMap: Record<string, { name: string; unitsSold: number; revenue: number }> = {};
    const custMap: Record<string, { id: string; name: string; country: string; ordersCount: number; totalSpent: number }> = {};

    for (const s of currentSales) {
      if (s.customerId && s.customer) {
        if (!custMap[s.customerId]) {
          custMap[s.customerId] = {
            id: s.customerId,
            name: s.customer.name,
            country: s.customer.address || "Pakistan",
            ordersCount: 0,
            totalSpent: 0
          };
        }
        custMap[s.customerId].ordersCount += 1;
        custMap[s.customerId].totalSpent += Number(s.totalAmount || 0);
      }

      for (const item of s.items) {
        const p = item.product;
        const qty = Number(item.quantity || 0);
        const rev = Number(item.totalPrice || 0);
        const imgs = Array.isArray(p.images) ? p.images : [];
        if (!prodMap[p.id]) {
          prodMap[p.id] = {
            id: p.id,
            name: p.name,
            image: typeof imgs[0] === "string" ? imgs[0] : "",
            price: Number(p.sellingPrice || 0),
            unitsSold: 0,
            revenue: 0
          };
        }
        prodMap[p.id].unitsSold += qty;
        prodMap[p.id].revenue += rev;

        const catName = p.category?.name || "Uncategorized";
        if (!catMap[catName]) {
          catMap[catName] = { name: catName, unitsSold: 0, revenue: 0 };
        }
        catMap[catName].unitsSold += qty;
        catMap[catName].revenue += rev;
      }
    }

    const topSellingProducts = Object.values(prodMap)
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, 5);

    const topCategories = Object.values(catMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const topCustomers = Object.values(custMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    const custValues = Object.values(custMap);
    const firstTimeCount = custValues.filter(c => c.ordersCount === 1).length;
    const returnCount = custValues.filter(c => c.ordersCount > 1).length;
    const totalActiveCust = firstTimeCount + returnCount;
    const firstTimePct = totalActiveCust > 0 ? Math.round((firstTimeCount / totalActiveCust) * 100) : 0;
    const returnPct = totalActiveCust > 0 ? Math.round((returnCount / totalActiveCust) * 100) : 0;

    // Low Stock Products
    const lowStockProducts: Array<{ id: string; name: string; sku: string; image: string; stockQty: number; alertQuantity: number }> = [];
    for (const p of productsWithStock) {
      const vStock = p.variants.reduce((sum, v) => sum + Number(v.stockQty || 0), 0);
      const wStock = p.stockBalances.reduce((sum, b) => sum + Number(b.quantity || 0), 0);
      const totalStock = p.variants.length > 0 ? vStock : wStock;
      const alertQty = Number(p.alertQuantity ?? 5);
      if (totalStock <= alertQty) {
        const imgs = Array.isArray(p.images) ? p.images : [];
        lowStockProducts.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          image: typeof imgs[0] === "string" ? imgs[0] : "",
          stockQty: totalStock,
          alertQuantity: alertQty
        });
      }
    }
    lowStockProducts.sort((a, b) => a.stockQty - b.stockQty);

    // Recent Sales
    const recentSales = recentSalesList.map(s => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      customerName: s.customer?.name || "Walk-in Customer",
      categoryName: s.items[0]?.product?.category?.name || "Apparel",
      itemName: s.items[0]?.product?.name || s.invoiceNumber,
      totalAmount: Number(s.totalAmount || 0),
      status: s.status,
      paymentStatus: s.paymentStatus,
      date: s.createdAt.toISOString()
    }));

    // Recent Transactions (All, Sales, Purchase, Expenses)
    const txSales = recentSalesList.map(s => ({
      id: s.id,
      date: s.createdAt.toISOString(),
      party: s.customer?.name || "Walk-in Customer",
      reference: s.invoiceNumber,
      status: s.status,
      total: Number(s.totalAmount || 0),
      type: "Sale"
    }));
    const txPurchases = recentPurchasesList.map(p => ({
      id: p.id,
      date: p.createdAt.toISOString(),
      party: p.supplier?.name || "Supplier",
      reference: p.purchaseNumber,
      status: p.status,
      total: Number(p.totalAmount || 0),
      type: "Purchase"
    }));
    const txExpenses = recentExpensesList.map(e => ({
      id: e.id,
      date: e.date.toISOString(),
      party: e.category?.name || "Expense",
      reference: e.expenseNumber,
      status: "Recorded",
      total: Number(e.amount || 0) + Number(e.taxAmount || 0),
      type: "Expense"
    }));
    const txAll = [...txSales, ...txPurchases, ...txExpenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Order Statistics Heatmap (7 days x 7 time slots)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const timeSlots = ["8 Am", "10 Am", "12 Pm", "2 Pm", "4 Pm", "6 Pm", "8 Pm"];
    const heatmapCounts: Record<string, number[]> = {};
    for (const sl of timeSlots) heatmapCounts[sl] = [0, 0, 0, 0, 0, 0, 0];

    for (const s of currentSales) {
      const d = s.createdAt;
      const dayIdx = d.getDay(); // 0=Sun..6=Sat
      const hr = d.getHours();
      let slotIdx = 0;
      if (hr < 10) slotIdx = 0;
      else if (hr < 12) slotIdx = 1;
      else if (hr < 14) slotIdx = 2;
      else if (hr < 16) slotIdx = 3;
      else if (hr < 18) slotIdx = 4;
      else if (hr < 20) slotIdx = 5;
      else slotIdx = 6;
      heatmapCounts[timeSlots[slotIdx]][dayIdx] += 1;
    }
    const orderHeatmap = timeSlots.map(slot => ({
      name: slot,
      data: dayNames.map((day, idx) => ({ x: day, y: heatmapCounts[slot][idx] }))
    }));

    return {
      period,
      kpis: {
        totalSales: Number(totalSales.toFixed(2)),
        totalSalesReturns: Number(totalSalesReturns.toFixed(2)),
        totalPurchases: Number(totalPurchases.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        profit: Number(profit.toFixed(2)),
        invoiceDue: Number(invoiceDue.toFixed(2)),
        paymentReturns: Number(paymentReturns.toFixed(2)),
        changes: {
          salesPct: calcPct(totalSales, prevSalesVal),
          salesReturnPct: calcPct(totalSalesReturns, prevSalesReturnsVal),
          purchasePct: calcPct(totalPurchases, prevPurchasesVal),
          expensePct: calcPct(totalExpenses, prevExpensesVal),
          profitPct: calcPct(profit, prevProfitVal),
          invoiceDuePct: calcPct(invoiceDue, prevInvoiceDueVal),
          paymentReturnPct: calcPct(paymentReturns, prevPaymentReturnsVal)
        }
      },
      salesAndPurchaseChart: {
        categories: bucketLabels,
        sales: bucketKeys.map(k => Number(salesBuckets[k].toFixed(2))),
        purchase: bucketKeys.map(k => Number(purchaseBuckets[k].toFixed(2))),
        totalSales: Number(totalSales.toFixed(2)),
        totalPurchase: Number(totalPurchases.toFixed(2))
      },
      overallInfo: {
        suppliersCount,
        customersCount,
        ordersCount: currentSales.length
      },
      customersOverview: {
        firstTimeCount,
        returnCount,
        firstTimePct,
        returnPct
      },
      topSellingProducts,
      lowStockProducts: lowStockProducts.slice(0, 5),
      lowStockTotalCount: lowStockProducts.length,
      recentSales,
      salesStatistics: {
        categories: bucketLabels,
        revenue: bucketKeys.map(k => Number(salesBuckets[k].toFixed(2))),
        expenses: bucketKeys.map(k => -Number(expenseBuckets[k].toFixed(2))),
        totalRevenue: Number(totalSales.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        revenueChangePct: calcPct(totalSales, prevSalesVal),
        expensesChangePct: calcPct(totalExpenses, prevExpensesVal)
      },
      recentTransactions: {
        all: txAll,
        sales: txSales,
        purchase: txPurchases,
        expenses: txExpenses
      },
      topCustomers,
      topCategories,
      catalogSummary: {
        totalCategoriesCount: categoriesCount,
        totalProductsCount: productsCount
      },
      orderHeatmap
    };
  }
}

export const dashboardService = new DashboardService();
