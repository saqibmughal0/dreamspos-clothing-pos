import { describe, it, expect, vi, afterEach } from "vitest";
import { prisma } from "@dreamspos/database";
import { settingsService } from "../src/modules/settings/settings.service";
import { inventoryService } from "../src/modules/inventory/inventory.service";
import { productService } from "../src/modules/products/product.service";
import { dashboardService } from "../src/modules/dashboard/dashboard.service";

describe("Phase A — No Fake / Demo Data Fallbacks Verification", () => {
  const mockCompanyId = "22222222-2222-4222-8222-222222222222";

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. SettingsService returns clean empty defaults with PKR currency when no settings exist in DB", async () => {
    vi.spyOn(prisma.setting, "findMany").mockResolvedValue([]);

    const settings = await settingsService.getSettings(mockCompanyId);

    expect(settings.shopName).toBe("");
    expect(settings.brandName).toBe("");
    expect(settings.email).toBe("");
    expect(settings.phone).toBe("");
    expect(settings.address).toBe("");
    expect(settings.taxNumber).toBe("");
    expect(settings.currency.code).toBe("PKR");
    expect(settings.currency.symbol).toBe("Rs");
    expect(settings.tax.rate).toBe(0);
    expect(settings.shopName).not.toContain("Dreams Apparel");
  });

  it("2. SettingsService preserves saved database settings without overwriting them", async () => {
    vi.spyOn(prisma.setting, "findMany").mockResolvedValue([
      {
        id: "s1",
        companyId: mockCompanyId,
        group: "BUSINESS",
        key: "shopName",
        value: JSON.stringify("MR Bilal Clothing"),
        updatedAt: new Date()
      },
      {
        id: "s2",
        companyId: mockCompanyId,
        group: "BUSINESS",
        key: "phone",
        value: JSON.stringify("+92 300 1234567"),
        updatedAt: new Date()
      }
    ] as any);

    const settings = await settingsService.getSettings(mockCompanyId);

    expect(settings.shopName).toBe("MR Bilal Clothing");
    expect(settings.phone).toBe("+92 300 1234567");
    expect(settings.currency.code).toBe("PKR");
  });

  it("3. InventoryService.getLowStockAlerts returns zero alerts when no products exist", async () => {
    vi.spyOn(prisma.product, "findMany").mockResolvedValue([]);

    const alerts = await inventoryService.getLowStockAlerts(mockCompanyId);

    expect(alerts.lowStockCount).toBe(0);
    expect(alerts.outOfStockCount).toBe(0);
    expect(alerts.lowStockItems).toEqual([]);
    expect(alerts.outOfStockItems).toEqual([]);
  });

  it("4. InventoryService.getValuation returns empty items and zero totals when no stock exists", async () => {
    vi.spyOn(prisma.product, "findMany").mockResolvedValue([]);

    const valuation = await inventoryService.getValuation(mockCompanyId);

    expect(valuation.items).toEqual([]);
    expect(valuation.summary.totalProducts).toBe(0);
    expect(valuation.summary.totalQuantity).toBe(0);
    expect(valuation.summary.totalCostValue).toBe(0);
    expect(valuation.summary.totalRetailValue).toBe(0);
  });

  it("5. ProductService does not inject 'Dreams Apparel' brand fallback or USD currency when brand is null", async () => {
    vi.spyOn(prisma.product, "findMany").mockResolvedValue([
      {
        id: "prod-1",
        companyId: mockCompanyId,
        categoryId: "cat-1",
        brandId: null,
        unitId: "unit-1",
        name: "Cotton Kurta",
        articleCode: "CK-01",
        sku: "CK-01-M",
        barcode: "1234567890123",
        costPrice: 1200,
        sellingPrice: 2200,
        taxRate: 0,
        alertQuantity: 5,
        isActive: true,
        createdAt: new Date(),
        category: { id: "cat-1", name: "Eastern Wear", code: "EW" },
        brand: null,
        unit: { id: "unit-1", name: "Piece", shortName: "pc" },
        variants: [],
        stockBalances: [],
        images: null
      }
    ] as any);
    vi.spyOn(prisma.product, "count").mockResolvedValue(1);

    const result = await productService.list(mockCompanyId, {});
    expect(result.items).toHaveLength(1);
    expect(result.items[0].brandName).toBe("");
    expect(result.items[0].brandName).not.toBe("Dreams Apparel");

    const labels = await productService.getBarcodeLabels(mockCompanyId, ["prod-1"]);
    expect(labels).toHaveLength(1);
    expect(labels[0].brand).toBe("");
    expect(labels[0].currency).toBe("PKR");
  });

  it("6. DashboardService.getSummary returns exact zeros when database has no transactions", async () => {
    vi.spyOn(prisma.sale, "aggregate").mockResolvedValue({
      _sum: { totalAmount: null },
      _count: { id: 0 }
    } as any);
    vi.spyOn(prisma.purchase, "aggregate").mockResolvedValue({
      _sum: { totalAmount: null }
    } as any);
    vi.spyOn(prisma.expense, "aggregate").mockResolvedValue({
      _sum: { amount: null, taxAmount: null }
    } as any);
    vi.spyOn(prisma.salesReturn, "aggregate").mockResolvedValue({
      _sum: { refundAmount: null }
    } as any);
    vi.spyOn(prisma.product, "count").mockResolvedValue(0);
    vi.spyOn(prisma.customer, "count").mockResolvedValue(0);
    vi.spyOn(prisma.productVariant, "count").mockResolvedValue(0);

    const summary = await dashboardService.getSummary(mockCompanyId);

    expect(summary.totalSales).toBe(0);
    expect(summary.todaySales).toBe(0);
    expect(summary.todayOrders).toBe(0);
    expect(summary.totalPurchases).toBe(0);
    expect(summary.totalExpenses).toBe(0);
    expect(summary.netProfit).toBe(0);
    expect(summary.productsCount).toBe(0);
    expect(summary.customersCount).toBe(0);
    expect(summary.lowStockCount).toBe(0);
  });

  it("7. DashboardService.getOverview returns exact zeros and empty lists when database has no records", async () => {
    vi.spyOn(prisma.sale, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.sale, "aggregate").mockResolvedValue({ _sum: { totalAmount: null, dueAmount: null } } as any);
    vi.spyOn(prisma.salesReturn, "aggregate").mockResolvedValue({ _sum: { refundAmount: null } } as any);
    vi.spyOn(prisma.purchase, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.purchase, "aggregate").mockResolvedValue({ _sum: { totalAmount: null } } as any);
    vi.spyOn(prisma.purchaseReturn, "aggregate").mockResolvedValue({ _sum: { refundAmount: null } } as any);
    vi.spyOn(prisma.expense, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.expense, "aggregate").mockResolvedValue({ _sum: { amount: null, taxAmount: null } } as any);
    vi.spyOn(prisma.supplier, "count").mockResolvedValue(0);
    vi.spyOn(prisma.customer, "count").mockResolvedValue(0);
    vi.spyOn(prisma.category, "count").mockResolvedValue(0);
    vi.spyOn(prisma.product, "count").mockResolvedValue(0);
    vi.spyOn(prisma.product, "findMany").mockResolvedValue([]);

    const overview = await dashboardService.getOverview(mockCompanyId, "1Y");

    expect(overview.kpis.totalSales).toBe(0);
    expect(overview.kpis.totalSalesReturns).toBe(0);
    expect(overview.kpis.totalPurchases).toBe(0);
    expect(overview.kpis.totalExpenses).toBe(0);
    expect(overview.kpis.profit).toBe(0);
    expect(overview.kpis.invoiceDue).toBe(0);
    expect(overview.kpis.paymentReturns).toBe(0);
    expect(overview.kpis.changes.salesPct).toBe(0);
    expect(overview.overallInfo).toEqual({ suppliersCount: 0, customersCount: 0, ordersCount: 0 });
    expect(overview.topSellingProducts).toEqual([]);
    expect(overview.lowStockProducts).toEqual([]);
    expect(overview.recentSales).toEqual([]);
    expect(overview.topCustomers).toEqual([]);
    expect(overview.topCategories).toEqual([]);
    expect(overview.recentTransactions.all).toEqual([]);
    expect(overview.salesAndPurchaseChart.sales.every((v) => v === 0)).toBe(true);
    expect(overview.salesAndPurchaseChart.purchase.every((v) => v === 0)).toBe(true);
  });
});
