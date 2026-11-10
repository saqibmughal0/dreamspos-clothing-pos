import { describe, it, expect, vi } from "vitest";
import { authService } from "../src/modules/auth/auth.service";
import { dashboardService } from "../src/modules/dashboard/dashboard.service";
import { prisma } from "@dreamspos/database";

describe("Dashboard API & Service Endpoints", () => {
  const mockCompanyId = "11111111-1111-4111-8111-111111111111";

  it("1. Dashboard summary calculation logic returns structured metrics", async () => {
    // Spy on prisma calls to provide deterministic test data without requiring an open network socket in sandbox
    const saleAggregateSpy = vi.spyOn(prisma.sale, "aggregate").mockResolvedValue({
      _sum: { totalAmount: (125000.50 as any) },
      _count: { id: 45 } as any,
      _avg: {} as any,
      _min: {} as any,
      _max: {} as any
    });

    const purchaseAggregateSpy = vi.spyOn(prisma.purchase, "aggregate").mockResolvedValue({
      _sum: { totalAmount: (45000.00 as any) },
      _count: {} as any,
      _avg: {} as any,
      _min: {} as any,
      _max: {} as any
    });

    const expenseAggregateSpy = vi.spyOn(prisma.expense, "aggregate").mockResolvedValue({
      _sum: { amount: (5000.00 as any), taxAmount: (250.00 as any) },
      _count: {} as any,
      _avg: {} as any,
      _min: {} as any,
      _max: {} as any
    });

    const productCountSpy = vi.spyOn(prisma.product, "count").mockResolvedValue(120);
    const customerCountSpy = vi.spyOn(prisma.customer, "count").mockResolvedValue(85);
    const variantCountSpy = vi.spyOn(prisma.productVariant, "count").mockResolvedValue(350);
    const returnsSpy = vi.spyOn(prisma.salesReturn, "aggregate").mockResolvedValue({
      _sum: { refundAmount: (1200.00 as any) },
      _count: {} as any,
      _avg: {} as any,
      _min: {} as any,
      _max: {} as any
    });

    const summary = await dashboardService.getSummary(mockCompanyId);

    expect(summary).toBeDefined();
    expect(summary.totalSales).toBe(125000.50);
    expect(summary.totalPurchases).toBe(45000.00);
    expect(summary.totalExpenses).toBe(5250.00);
    expect(summary.totalRefunds).toBe(1200.00);
    expect(summary.netSales).toBe(123800.50);
    expect(summary.productsCount).toBe(120);
    expect(summary.customersCount).toBe(85);

    saleAggregateSpy.mockRestore();
    purchaseAggregateSpy.mockRestore();
    expenseAggregateSpy.mockRestore();
    productCountSpy.mockRestore();
    customerCountSpy.mockRestore();
    variantCountSpy.mockRestore();
    returnsSpy.mockRestore();
  });

  it("2. Dashboard summary handles date range filtering accurately", async () => {
    const saleAggregateSpy = vi.spyOn(prisma.sale, "aggregate").mockResolvedValue({
      _sum: { totalAmount: (25000.00 as any) },
      _count: { id: 10 } as any,
      _avg: {} as any,
      _min: {} as any,
      _max: {} as any
    });
    vi.spyOn(prisma.purchase, "aggregate").mockResolvedValue({ _sum: { totalAmount: (10000 as any) } } as any);
    vi.spyOn(prisma.expense, "aggregate").mockResolvedValue({ _sum: { amount: (1000 as any), taxAmount: (0 as any) } } as any);
    vi.spyOn(prisma.product, "count").mockResolvedValue(120);
    vi.spyOn(prisma.customer, "count").mockResolvedValue(85);
    vi.spyOn(prisma.productVariant, "count").mockResolvedValue(350);
    vi.spyOn(prisma.salesReturn, "aggregate").mockResolvedValue({ _sum: { refundAmount: (500 as any) } } as any);

    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();

    const summary = await dashboardService.getSummary(mockCompanyId, startDate, endDate);

    expect(summary).toBeDefined();
    expect(summary.totalSales).toBe(25000.00);
    expect(summary.netSales).toBe(24500.00);

    vi.restoreAllMocks();
  });

  it("3. Dashboard clothing analytics aggregates garment stats and inventory valuation", async () => {
    vi.spyOn(prisma.sale, "findMany").mockResolvedValue([
      { id: "sale-1", totalAmount: (200 as any), createdAt: new Date() } as any
    ]);

    vi.spyOn(prisma.saleItem, "findMany").mockResolvedValue([
      {
        id: "item-1",
        quantity: 2,
        unitPrice: (100 as any),
        product: { id: "p-1", name: "Linen Shirt", articleCode: "ART-01", sku: "SKU-01", category: { name: "Shirts" }, costPrice: (40 as any), sellingPrice: (100 as any) },
        variant: { size: "L", color: "Blue", costPrice: (40 as any), priceDiff: (0 as any), stockQty: (15 as any) }
      } as any
    ]);

    vi.spyOn(prisma.product, "findMany").mockResolvedValue([
      {
        id: "p-1",
        name: "Linen Shirt",
        costPrice: (40 as any),
        sellingPrice: (100 as any),
        variants: [
          { id: "v-1", size: "L", color: "Blue", costPrice: (40 as any), priceDiff: (0 as any), stockQty: (15 as any) }
        ],
        stockBalances: [{ quantity: 15 }]
      } as any
    ]);

    vi.spyOn(prisma.expense, "findMany").mockResolvedValue([]);

    const analytics = await dashboardService.getClothingAnalytics(mockCompanyId);

    expect(analytics).toBeDefined();
    expect(analytics.topSellingArticles.length).toBeGreaterThan(0);
    expect(analytics.topSellingArticles[0].name).toBe("Linen Shirt");
    expect(analytics.topSellingArticles[0].unitsSold).toBe(2);
    expect(analytics.inventoryValuation.totalCostValuation).toBe(600);
    expect(analytics.inventoryValuation.totalRetailValuation).toBe(1500);

    vi.restoreAllMocks();
  });

  it("4. Dashboard recent transactions maps sale records to UI format", async () => {
    vi.spyOn(prisma.sale, "findMany").mockResolvedValue([
      {
        id: "s-1",
        invoiceNumber: "INV-2026-001",
        totalAmount: (150.00 as any),
        status: "COMPLETED",
        createdAt: new Date("2026-11-07T10:00:00Z"),
        customer: { name: "John Doe" },
        items: [{ id: "si-1" }]
      } as any
    ]);

    const transactions = await dashboardService.getRecentTransactions(mockCompanyId, 5);

    expect(transactions).toBeDefined();
    expect(transactions.length).toBe(1);
    expect(transactions[0].invoiceNumber).toBe("INV-2026-001");
    expect(transactions[0].customerName).toBe("John Doe");
    expect(transactions[0].amount).toBe(150.00);

    vi.restoreAllMocks();
  });
});
