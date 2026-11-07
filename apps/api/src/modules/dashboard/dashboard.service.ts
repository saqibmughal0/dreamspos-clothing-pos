import { prisma } from "@dreamspos/database";

export class DashboardService {
  async getSummary(companyId: string) {
    const [salesAggregate, purchaseAggregate, productsCount, customersCount, lowStockCount] = await Promise.all([
      prisma.sale.aggregate({
        where: { companyId, status: "COMPLETED" },
        _sum: { totalAmount: true }
      }),
      prisma.purchase.aggregate({
        where: { companyId, status: "RECEIVED" },
        _sum: { totalAmount: true }
      }),
      prisma.product.count({ where: { companyId, isActive: true } }),
      prisma.customer.count({ where: { companyId } }),
      prisma.product.count({
        where: {
          companyId,
          isActive: true,
          stockBalances: {
            some: {
              quantity: { lte: 10 }
            }
          }
        }
      })
    ]);

    const totalSales = Number(salesAggregate._sum.totalAmount || 0);
    const totalPurchases = Number(purchaseAggregate._sum.totalAmount || 0);
    const estimatedProfit = Math.max(0, totalSales - totalPurchases);

    return {
      totalSales,
      totalPurchases,
      totalExpenses: 0,
      netProfit: estimatedProfit,
      productsCount,
      customersCount,
      lowStockCount
    };
  }

  async getRecentTransactions(companyId: string, limit = 5) {
    const sales = await prisma.sale.findMany({
      where: { companyId },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { customer: true }
    });

    return sales.map(s => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      customerName: s.customer?.name || "Walk-in Customer",
      amount: Number(s.totalAmount),
      status: s.status,
      date: s.createdAt.toISOString()
    }));
  }
}

export const dashboardService = new DashboardService();
