import { describe, it, expect } from "vitest";
import { addMoney, subMoney, mulMoney, roundMoney } from "../src/utils/decimal";

describe("Clothing Retail POS: Size/Color Variants, Returns & Exchanges", () => {
  it("should calculate clothing size and color variant line item accurately", () => {
    // Classic Cotton Crewneck Tee (Navy Blue - Size L)
    // 2 units at $24.99 with $2.00 promo line discount
    const qty = 2;
    const unitPrice = 24.99;
    const lineDiscount = 2.00;

    const lineTotal = subMoney(mulMoney(qty, unitPrice), lineDiscount);
    expect(lineTotal).toBe(47.98);
  });

  it("should calculate exact price differential for size/color clothing exchange", () => {
    // Customer returns: Oxford Shirt Size M ($49.99)
    // Customer exchanges for: Pullover Hoodie Size L ($59.99)
    // Extra amount customer must pay: ($59.99 - $49.99) = $10.00
    const returnedUnitPrice = 49.99;
    const replacementUnitPrice = 59.99;
    const exchangeQty = 1;

    const priceDiff = roundMoney((replacementUnitPrice - returnedUnitPrice) * exchangeQty);
    expect(priceDiff).toBe(10.00);
  });

  it("should calculate exact refund amount for equal-value clothing size exchange", () => {
    // Customer exchanges Oxford Shirt Sky Blue Size M for Oxford Shirt Crisp White Size L (same price $49.99)
    // Price difference is $0.00
    const returnedUnitPrice = 49.99;
    const replacementUnitPrice = 49.99;

    const priceDiff = roundMoney(subMoney(replacementUnitPrice, returnedUnitPrice));
    expect(priceDiff).toBe(0.00);
  });

  it("should calculate sales return refund and restock calculation", () => {
    // Customer returns 1 Denim Jean ($69.99) from 2 originally purchased
    const purchasedQty = 2;
    const returnQty = 1;
    const unitPrice = 69.99;

    expect(returnQty).toBeLessThanOrEqual(purchasedQty);
    const refundAmount = roundMoney(mulMoney(returnQty, unitPrice));
    expect(refundAmount).toBe(69.99);

    const remainingQty = purchasedQty - returnQty;
    expect(remainingQty).toBe(1);
  });

  it("should reconcile cash register shift expected vs actual cash count", () => {
    const openingFloat = 200.00;
    const cashSales = [24.99, 49.99, 69.99, 34.99]; // Cash payments received
    const totalCashSales = cashSales.reduce((sum, amt) => addMoney(sum, amt), 0); // 179.96

    const expectedCash = roundMoney(addMoney(openingFloat, totalCashSales)); // 379.96
    expect(expectedCash).toBe(379.96);

    // If counted closing cash is $380.00, cash overage is +$0.04
    const countedCash = 380.00;
    const difference = roundMoney(subMoney(countedCash, expectedCash));
    expect(difference).toBe(0.04);
  });
});
