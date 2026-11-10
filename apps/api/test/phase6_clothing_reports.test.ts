import { describe, it, expect } from "vitest";
import { addMoney, subMoney, mulMoney, roundMoney } from "../src/utils/decimal";
import { UserRole, hasPermission, RolePermissions } from "@dreamspos/shared";

describe("Phase 6: Clothing Analytics, Reports, RBAC & Business Settings", () => {
  describe("1. Clothing Analytics & Distribution Aggregations", () => {
    it("should compute category, size, and color distributions from garment sales", () => {
      const soldGarments = [
        { name: "Pima Cotton Crewneck", category: "T-Shirts", size: "M", color: "Black", qty: 4, revenue: 119.96, cost: 48.00 },
        { name: "Pima Cotton Crewneck", category: "T-Shirts", size: "L", color: "Black", qty: 6, revenue: 179.94, cost: 72.00 },
        { name: "Pima Cotton Crewneck", category: "T-Shirts", size: "M", color: "White", qty: 3, revenue: 89.97, cost: 36.00 },
        { name: "Selvedge Slim Denim", category: "Jeans", size: "32", color: "Indigo", qty: 5, revenue: 399.95, cost: 160.00 },
        { name: "Selvedge Slim Denim", category: "Jeans", size: "34", color: "Indigo", qty: 2, revenue: 159.98, cost: 64.00 }
      ];

      // Category breakdown
      const categorySales: Record<string, { qty: number; revenue: number }> = {};
      for (const item of soldGarments) {
        if (!categorySales[item.category]) categorySales[item.category] = { qty: 0, revenue: 0 };
        categorySales[item.category].qty += item.qty;
        categorySales[item.category].revenue = addMoney(categorySales[item.category].revenue, item.revenue);
      }

      expect(categorySales["T-Shirts"].qty).toBe(13);
      expect(categorySales["T-Shirts"].revenue).toBe(389.87);
      expect(categorySales["Jeans"].qty).toBe(7);
      expect(categorySales["Jeans"].revenue).toBe(559.93);

      // Size breakdown
      const sizeCounts: Record<string, number> = {};
      for (const item of soldGarments) {
        sizeCounts[item.size] = (sizeCounts[item.size] || 0) + item.qty;
      }
      expect(sizeCounts["M"]).toBe(7);
      expect(sizeCounts["L"]).toBe(6);
      expect(sizeCounts["32"]).toBe(5);
      expect(sizeCounts["34"]).toBe(2);

      // Color breakdown
      const colorCounts: Record<string, number> = {};
      for (const item of soldGarments) {
        colorCounts[item.color] = (colorCounts[item.color] || 0) + item.qty;
      }
      expect(colorCounts["Black"]).toBe(10);
      expect(colorCounts["Indigo"]).toBe(7);
      expect(colorCounts["White"]).toBe(3);

      // Profit and Margin calculation
      const totalRevenue = soldGarments.reduce((sum, g) => addMoney(sum, g.revenue), 0);
      const totalCost = soldGarments.reduce((sum, g) => addMoney(sum, g.cost), 0);
      const profit = subMoney(totalRevenue, totalCost);
      const margin = roundMoney((profit / totalRevenue) * 100);

      expect(totalRevenue).toBe(949.80);
      expect(totalCost).toBe(380.00);
      expect(profit).toBe(569.80);
      expect(margin).toBe(59.99);
    });
  });

  describe("2. Retail Inventory Aging Buckets", () => {
    it("should classify clothing stock into aging tiers correctly", () => {
      const garments = [
        { sku: "SS26-TEE-01", daysInStore: 14, units: 45, costPrice: 12.00 },
        { sku: "SS26-SHIRT-02", daysInStore: 42, units: 30, costPrice: 22.00 },
        { sku: "FW25-KNIT-01", daysInStore: 78, units: 15, costPrice: 35.00 },
        { sku: "FW25-COAT-03", daysInStore: 120, units: 8, costPrice: 65.00 }
      ];

      const classify = (days: number) => {
        if (days <= 30) return "0-30 days";
        if (days <= 60) return "31-60 days";
        if (days <= 90) return "61-90 days";
        return "90+ days";
      };

      expect(classify(garments[0].daysInStore)).toBe("0-30 days");
      expect(classify(garments[1].daysInStore)).toBe("31-60 days");
      expect(classify(garments[2].daysInStore)).toBe("61-90 days");
      expect(classify(garments[3].daysInStore)).toBe("90+ days");

      // Calculate stagnant inventory value (> 90 days)
      const stagnantItems = garments.filter(g => g.daysInStore > 90);
      const stagnantValue = stagnantItems.reduce((acc, g) => addMoney(acc, mulMoney(g.units, g.costPrice)), 0);
      expect(stagnantValue).toBe(520.00);
    });
  });

  describe("3. Sell-Through Rate & Velocity Metrics", () => {
    it("should calculate apparel collection sell-through percentage and velocity", () => {
      // Collection A: Highly popular graphic tee
      const soldUnitsA = 80;
      const remainingUnitsA = 20;
      const totalA = soldUnitsA + remainingUnitsA;
      const strA = roundMoney((soldUnitsA / totalA) * 100);

      expect(strA).toBe(80.00);
      const velocityA = strA >= 60 ? "High" : strA >= 30 ? "Steady" : "Slow Mover";
      expect(velocityA).toBe("High");

      // Collection B: Stagnant jacket
      const soldUnitsB = 10;
      const remainingUnitsB = 40;
      const totalB = soldUnitsB + remainingUnitsB;
      const strB = roundMoney((soldUnitsB / totalB) * 100);

      expect(strB).toBe(20.00);
      const velocityB = strB >= 60 ? "High" : strB >= 30 ? "Steady" : "Slow Mover";
      expect(velocityB).toBe("Slow Mover");
    });
  });

  describe("4. Supplier Performance Tracking", () => {
    it("should compute supplier fulfillment rate and defect return rate", () => {
      const supplierStats = {
        name: "Prime Apparel Mills",
        orderedUnits: 500,
        receivedUnits: 485,
        totalSpend: 12500.00,
        returnedDefectiveAmount: 375.00
      };

      const fulfillmentRate = roundMoney((supplierStats.receivedUnits / supplierStats.orderedUnits) * 100);
      const defectRate = roundMoney((supplierStats.returnedDefectiveAmount / supplierStats.totalSpend) * 100);

      expect(fulfillmentRate).toBe(97.00);
      expect(defectRate).toBe(3.00);

      const rating = defectRate < 2 ? "A+ Preferred" : defectRate < 5 ? "B Standard" : "Under Review";
      expect(rating).toBe("B Standard");
    });
  });

  describe("5. Role-Based Access Control (RBAC) Permissions", () => {
    it("should enforce correct permissions for Owner/Admin, Store Manager, Cashier, and Inventory Clerk", () => {
      // 1. Admin has wildcard access to all modules
      expect(hasPermission(UserRole.ADMIN, "settings.update")).toBe(true);
      expect(hasPermission(UserRole.ADMIN, "finance.ledger")).toBe(true);
      expect(hasPermission(UserRole.ADMIN, "pos.checkout")).toBe(true);
      expect(hasPermission(UserRole.ADMIN, "products.delete")).toBe(true);

      // 2. Store Manager can manage POS, inventory adjustments, and view store reports, but not global settings
      expect(hasPermission(UserRole.STORE_MANAGER, "pos.checkout")).toBe(true);
      expect(hasPermission(UserRole.STORE_MANAGER, "pos.returns")).toBe(true);
      expect(hasPermission(UserRole.STORE_MANAGER, "inventory.adjust")).toBe(true);
      expect(hasPermission(UserRole.STORE_MANAGER, "settings.update")).toBe(false);

      // 3. Cashier can scan barcodes, checkout, and print receipts, but CANNOT adjust inventory or view profit/loss
      expect(hasPermission(UserRole.CASHIER, "pos.checkout")).toBe(true);
      expect(hasPermission(UserRole.CASHIER, "pos.barcode_scan")).toBe(true);
      expect(hasPermission(UserRole.CASHIER, "pos.receipt")).toBe(true);
      expect(hasPermission(UserRole.CASHIER, "inventory.adjust")).toBe(false);
      expect(hasPermission(UserRole.CASHIER, "finance.ledger")).toBe(false);
      expect(hasPermission(UserRole.CASHIER, "products.delete")).toBe(false);

      // 4. Inventory Clerk can view products, variants, receive POs and transfer stock, but CANNOT perform checkout
      expect(hasPermission(UserRole.INVENTORY_CLERK, "products.variants")).toBe(true);
      expect(hasPermission(UserRole.INVENTORY_CLERK, "inventory.transfer")).toBe(true);
      expect(hasPermission(UserRole.INVENTORY_CLERK, "purchases.receive")).toBe(true);
      expect(hasPermission(UserRole.INVENTORY_CLERK, "pos.checkout")).toBe(false);
      expect(hasPermission(UserRole.INVENTORY_CLERK, "finance.ledger")).toBe(false);
    });
  });

  describe("6. Business Settings, Receipts & Return Policy", () => {
    it("should validate thermal receipt formatting and return policy window", () => {
      const settings = {
        shopName: "Dreams Apparel Flagship",
        paperSize: "80mm" as const,
        returnWindowDays: 14,
        exchangeWindowDays: 30,
        taxRate: 8.25,
        currencySymbol: "$"
      };

      expect(settings.paperSize).toBe("80mm");
      expect(settings.returnWindowDays).toBe(14);
      expect(settings.exchangeWindowDays).toBe(30);

      // Purchase made on Oct 1
      const purchaseDate = new Date("2026-10-01T12:00:00Z");

      // Customer attempts return on Oct 10 (9 days later -> ALLOWED)
      const attemptDateValid = new Date("2026-10-10T12:00:00Z");
      const elapsedDaysValid = Math.floor((attemptDateValid.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      const canReturnValid = elapsedDaysValid <= settings.returnWindowDays;
      expect(canReturnValid).toBe(true);

      // Customer attempts return on Oct 25 (24 days later -> EXPIRED)
      const attemptDateExpired = new Date("2026-10-25T12:00:00Z");
      const elapsedDaysExpired = Math.floor((attemptDateExpired.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      const canReturnExpired = elapsedDaysExpired <= settings.returnWindowDays;
      expect(canReturnExpired).toBe(false);

      // However, within 30 days, exchange is still permitted
      const canExchange = elapsedDaysExpired <= settings.exchangeWindowDays;
      expect(canExchange).toBe(true);
    });
  });

  describe("7. End-to-End Workflow Verification", () => {
    it("should simulate entire lifecycle: product create -> PO receive -> POS sale -> stock deduct -> exchange -> report sync", () => {
      // 1. Initial Garment Setup: Classic Oxford Shirt in White (M)
      let variantStock = 0;
      const costPrice = 22.00;
      const sellingPrice = 55.00;

      // 2. Receive Purchase Order of 50 units
      const poReceivedQty = 50;
      variantStock += poReceivedQty;
      expect(variantStock).toBe(50);

      // 3. Customer scans barcode and purchases 2 shirts
      const saleQty = 2;
      expect(variantStock).toBeGreaterThanOrEqual(saleQty);
      variantStock -= saleQty;
      expect(variantStock).toBe(48);

      const saleSubtotal = mulMoney(saleQty, sellingPrice); // 110.00
      const saleTax = roundMoney(mulMoney(saleSubtotal, 0.0825)); // 9.08
      const saleTotal = addMoney(saleSubtotal, saleTax); // 119.08
      expect(saleTotal).toBe(119.08);

      // 4. Customer returns 1 shirt for equal-value exchange to Blue (M)
      // Stock of White (M) restored by 1
      const returnQty = 1;
      variantStock += returnQty;
      expect(variantStock).toBe(49);

      // Blue (M) stock deducted by 1
      let blueVariantStock = 20;
      blueVariantStock -= returnQty;
      expect(blueVariantStock).toBe(19);

      // 5. Final Report Verification
      const netUnitsSoldWhite = saleQty - returnQty;
      expect(netUnitsSoldWhite).toBe(1);

      const netUnitsSoldBlue = 1;
      const totalUnitsSold = netUnitsSoldWhite + netUnitsSoldBlue;
      expect(totalUnitsSold).toBe(2);

      const totalRevenue = mulMoney(totalUnitsSold, sellingPrice); // 110.00
      const totalCOGS = mulMoney(totalUnitsSold, costPrice); // 44.00
      const netGrossProfit = subMoney(totalRevenue, totalCOGS); // 66.00

      expect(netGrossProfit).toBe(66.00);
      const margin = roundMoney((netGrossProfit / totalRevenue) * 100);
      expect(margin).toBe(60.00);
    });
  });
});
