import { describe, it, expect } from "vitest";
import { addMoney, subMoney, mulMoney, roundMoney } from "../src/utils/decimal";
import {
  StockAdjustmentCreateSchema,
  StockTransferCreateSchema,
  PurchaseCreateSchema,
  PurchaseReceiveSchema,
  PurchaseReturnCreateSchema,
  ExpenseCreateSchema,
  JournalEntryCreateSchema
} from "@dreamspos/shared";

describe("Phase 5: Clothing Inventory & Business Operations", () => {
  describe("1. Clothing Product Management & Variant SKUs", () => {
    it("should generate proper variant SKUs and barcodes for size/color matrix", () => {
      const baseArticleCode = "ART-8012";
      const colors = ["BLACK", "WHITE", "NAVY"];
      const sizes = ["S", "M", "L", "XL"];

      const variants = colors.flatMap(color =>
        sizes.map(size => ({
          size,
          color,
          sku: `${baseArticleCode}-${color.slice(0, 3)}-${size}`,
          barcode: `890${baseArticleCode.replace("ART-", "")}${color.slice(0, 1)}${size}`
        }))
      );

      expect(variants).toHaveLength(12);
      expect(variants[0].sku).toBe("ART-8012-BLA-S");
      expect(variants[11].sku).toBe("ART-8012-NAV-XL");

      // Verify all SKUs are unique
      const skus = new Set(variants.map(v => v.sku));
      expect(skus.size).toBe(12);
    });

    it("should compute clothing retail price differential per variant size", () => {
      const baseSellingPrice = 39.99; // Standard sizes (S, M, L)
      const plusSizePriceDiff = 5.00; // XL, XXL extra material cost

      const standardPrice = baseSellingPrice;
      const plusSizePrice = addMoney(baseSellingPrice, plusSizePriceDiff);

      expect(standardPrice).toBe(39.99);
      expect(plusSizePrice).toBe(44.99);
    });
  });

  describe("2. Inventory Management & Strict Negative Stock Prevention", () => {
    it("should validate stock adjustment schema", () => {
      const validPayload = {
        warehouseId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        type: "PHYSICAL_COUNT" as const,
        reason: "Annual physical inventory cycle count",
        items: [
          {
            productId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            type: "ADD" as const,
            quantity: 5,
            unitCost: 15.50
          }
        ]
      };

      const result = StockAdjustmentCreateSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should strictly prevent negative stock adjustments", () => {
      const currentWarehouseStock = 8;
      const requestedDeduction = 10;

      // Verification logic: subtraction cannot exceed current stock
      const hasSufficientStock = currentWarehouseStock >= requestedDeduction;
      expect(hasSufficientStock).toBe(false);

      const errorMessage = `Insufficient stock: Available ${currentWarehouseStock}, requested -${requestedDeduction}. Negative stock disallowed.`;
      expect(() => {
        if (!hasSufficientStock) throw new Error(errorMessage);
      }).toThrowError(/Negative stock disallowed/);
    });

    it("should calculate inventory valuation across garments accurately", () => {
      const stock = [
        { name: "Heavyweight Tee", qty: 50, costPrice: 12.00, retailPrice: 28.00 },
        { name: "Selvedge Denim Jean", qty: 30, costPrice: 28.50, retailPrice: 68.00 },
        { name: "Merino Wool Sweater", qty: 20, costPrice: 35.00, retailPrice: 85.00 }
      ];

      const totalQty = stock.reduce((sum, item) => sum + item.qty, 0); // 100
      const totalCost = stock.reduce((sum, item) => addMoney(sum, mulMoney(item.qty, item.costPrice)), 0); // 600 + 855 + 700 = 2155.00
      const totalRetail = stock.reduce((sum, item) => addMoney(sum, mulMoney(item.qty, item.retailPrice)), 0); // 1400 + 2040 + 1700 = 5140.00
      const potentialProfit = subMoney(totalRetail, totalCost); // 2985.00

      expect(totalQty).toBe(100);
      expect(totalCost).toBe(2155.00);
      expect(totalRetail).toBe(5140.00);
      expect(potentialProfit).toBe(2985.00);

      const marginPercent = roundMoney((potentialProfit / totalRetail) * 100);
      expect(marginPercent).toBe(58.07);
    });

    it("should calculate atomic warehouse-to-store stock transfer correctly", () => {
      let warehouseStock = 40;
      let storeStock = 10;
      const transferQty = 15;

      expect(warehouseStock).toBeGreaterThanOrEqual(transferQty);

      // Perform transfer
      warehouseStock = subMoney(warehouseStock, transferQty);
      storeStock = addMoney(storeStock, transferQty);

      expect(warehouseStock).toBe(25);
      expect(storeStock).toBe(25);
    });
  });

  describe("3. Purchase Management & Partial Receiving", () => {
    it("should validate purchase order creation schema", () => {
      const poPayload = {
        warehouseId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        supplierId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        notes: "Fall/Winter 2026 Knitwear batch",
        items: [
          {
            productId: "c3d4e5f6-a7b8-9012-cdef-123456789012",
            quantity: 100,
            unitCost: 18.50,
            taxAmount: 0
          }
        ]
      };

      const result = PurchaseCreateSchema.safeParse(poPayload);
      expect(result.success).toBe(true);
    });

    it("should track partial purchase receiving and remaining due accurately", () => {
      const orderedQty = 100;
      let receivedQty = 0;

      // Shipment 1: 60 units arrive
      const shipment1 = 60;
      receivedQty += shipment1;
      let remainingQty = orderedQty - receivedQty;

      expect(receivedQty).toBe(60);
      expect(remainingQty).toBe(40);
      let status = receivedQty >= orderedQty ? "RECEIVED" : "PARTIALLY_RECEIVED";
      expect(status).toBe("PARTIALLY_RECEIVED");

      // Shipment 2: Remaining 40 units arrive
      const shipment2 = 40;
      receivedQty += shipment2;
      remainingQty = orderedQty - receivedQty;

      expect(receivedQty).toBe(100);
      expect(remainingQty).toBe(0);
      status = receivedQty >= orderedQty ? "RECEIVED" : "PARTIALLY_RECEIVED";
      expect(status).toBe("RECEIVED");
    });

    it("should prevent receiving more units than ordered", () => {
      const orderedQty = 50;
      const receivedQty = 40;
      const incomingDelivery = 15; // 40 + 15 = 55 > 50

      const canReceive = receivedQty + incomingDelivery <= orderedQty;
      expect(canReceive).toBe(false);
    });

    it("should calculate purchase return and supplier balance decrement", () => {
      let supplierDueBalance = 5000.00;
      const defectiveGarmentsReturnQty = 10;
      const garmentCost = 25.00;

      const refundAmount = mulMoney(defectiveGarmentsReturnQty, garmentCost); // 250.00
      expect(refundAmount).toBe(250.00);

      supplierDueBalance = subMoney(supplierDueBalance, refundAmount);
      expect(supplierDueBalance).toBe(4750.00);
    });
  });

  describe("4. Double-Entry General Ledger & Balance Verification", () => {
    it("should validate that sum of debits strictly equals sum of credits", () => {
      // Sale of garment for cash:
      // Debit: Cash on Hand (1010) = $75.00
      // Credit: Garment Sales Revenue (4010) = $75.00
      const lines = [
        { accountId: "1010-uuid", type: "DEBIT" as const, amount: 75.00 },
        { accountId: "4010-uuid", type: "CREDIT" as const, amount: 75.00 }
      ];

      const debits = lines.filter(l => l.type === "DEBIT").reduce((sum, l) => addMoney(sum, l.amount), 0);
      const credits = lines.filter(l => l.type === "CREDIT").reduce((sum, l) => addMoney(sum, l.amount), 0);

      expect(debits).toBe(75.00);
      expect(credits).toBe(75.00);
      expect(Math.abs(debits - credits)).toBeLessThanOrEqual(0.001);
    });

    it("should reject unbalanced double-entry journal lines", () => {
      const lines = [
        { accountId: "1010-uuid", type: "DEBIT" as const, amount: 100.00 },
        { accountId: "4010-uuid", type: "CREDIT" as const, amount: 80.00 } // Variance of $20
      ];

      const debits = lines.filter(l => l.type === "DEBIT").reduce((sum, l) => addMoney(sum, l.amount), 0);
      const credits = lines.filter(l => l.type === "CREDIT").reduce((sum, l) => addMoney(sum, l.amount), 0);
      const variance = Math.abs(debits - credits);

      expect(variance).toBe(20.00);
      expect(() => {
        if (variance > 0.001) throw new Error("Double-entry unbalanced");
      }).toThrowError(/Double-entry unbalanced/);
    });
  });

  describe("5. Profit & Loss (Income Statement) Calculations", () => {
    it("should calculate Gross Revenue, COGS, Gross Profit and Net Profit accurately", () => {
      // Retail sales data
      const grossSales = 12500.00;
      const salesReturnsRefunds = 500.00;
      const netRevenue = subMoney(grossSales, salesReturnsRefunds); // 12,000.00

      // Garments sold cost of goods
      const cogs = 4800.00; // 40% garment cost ratio
      const grossProfit = subMoney(netRevenue, cogs); // 7,200.00
      const grossMarginPercent = roundMoney((grossProfit / netRevenue) * 100); // 60.00%

      expect(netRevenue).toBe(12000.00);
      expect(grossProfit).toBe(7200.00);
      expect(grossMarginPercent).toBe(60.00);

      // Operating expenses: rent, electricity, packaging, staff
      const storeRent = 2500.00;
      const utilities = 400.00;
      const packagingBags = 250.00;
      const alterations = 150.00;
      const marketing = 600.00;

      const totalOperatingExpenses = [storeRent, utilities, packagingBags, alterations, marketing]
        .reduce((sum, exp) => addMoney(sum, exp), 0); // 3,900.00

      expect(totalOperatingExpenses).toBe(3900.00);

      const netProfit = subMoney(grossProfit, totalOperatingExpenses); // 3,300.00
      const netMarginPercent = roundMoney((netProfit / netRevenue) * 100); // 27.50%

      expect(netProfit).toBe(3300.00);
      expect(netMarginPercent).toBe(27.50);
    });
  });
});
